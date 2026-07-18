"""
CPU-Optimized Training Script for Skin Disease Classification.
Designed for machines without a GPU.

Key adaptations vs. the GPU train.py:
  - EfficientNetB3 backbone (much lighter than V2-L, still high accuracy)
  - 224x224 input (vs 384 - cuts compute by ~3x)
  - Batch size 8 (fits in RAM without GPU)
  - Fewer total epochs (30) - enough to converge on CPU
  - Mixed-precision disabled (not helpful without GPU)
  - TF inter/intra op parallelism tuned for 12-core CPU
  - Saves best model to saved_model/skin_model.keras
  - Prints accuracy after each epoch so you can monitor progress

Usage:
    python train_cpu.py --data_dir "d:/SKIN CARE/data/IMG_CLASSES"

Expected training time on 12-core CPU:
    Phase 1 (frozen backbone): ~2-4 hours
    Phase 2 (fine-tune top layers): ~3-5 hours
    Total: ~5-9 hours
    Expected val accuracy: 82-92%

For GPU-quality accuracy (94-99%), use the full train.py on Google Colab.
"""

import argparse
import json
import os
from pathlib import Path

import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers

# -- CPU parallelism tuning ---------------------------------------------------
tf.config.threading.set_inter_op_parallelism_threads(6)
tf.config.threading.set_intra_op_parallelism_threads(6)

IMAGE_SIZE = 224        # B3 optimal; 3x faster than 384 on CPU
AUTOTUNE   = tf.data.AUTOTUNE


# ============================================================================
#  REGISTER FOCAL LOSS -- required for .keras save/load
# ============================================================================
@keras.saving.register_keras_serializable(package="SkinAI")
def focal_loss(gamma: float = 2.0, alpha: float = 0.25):
    """Focal loss -- registered so saved model loads without custom_objects."""
    def loss_fn(y_true, y_pred):
        y_true = tf.cast(tf.squeeze(y_true), tf.int32)
        y_pred = tf.clip_by_value(y_pred, 1e-8, 1.0 - 1e-8)
        y_true_one_hot = tf.one_hot(y_true, tf.shape(y_pred)[-1], dtype=tf.float32)
        ce   = -tf.reduce_sum(y_true_one_hot * tf.math.log(y_pred), axis=-1)
        p_t  = tf.reduce_sum(y_true_one_hot * y_pred, axis=-1)
        fw   = alpha * tf.pow(1.0 - p_t, gamma)
        return tf.reduce_mean(fw * ce)
    loss_fn.__name__ = "focal_loss"
    return loss_fn


# ============================================================================
#  MODEL DEFINITION -- EfficientNetB3 (lightweight, high accuracy)
# ============================================================================
def build_model(num_classes: int, image_size: int = IMAGE_SIZE) -> keras.Model:
    base = keras.applications.EfficientNetB3(
        include_top=False,
        weights="imagenet",
        input_shape=(image_size, image_size, 3),
        include_preprocessing=True,
    )
    base.trainable = False   # frozen in Phase 1

    inputs = keras.Input(shape=(image_size, image_size, 3), name="image_input")
    x = base(inputs, training=False)
    x = layers.GlobalAveragePooling2D(name="gap")(x)
    x = layers.BatchNormalization(name="bn_1")(x)
    x = layers.Dense(256, name="fc_1")(x)
    x = layers.BatchNormalization(name="bn_2")(x)
    x = layers.Activation("relu", name="act_1")(x)
    x = layers.Dropout(0.4, name="drop_1")(x)
    outputs = layers.Dense(num_classes, activation="softmax", name="predictions")(x)

    return keras.Model(inputs, outputs, name="skin_efficientnetb3")


# ============================================================================
#  DATA PIPELINE
# ============================================================================
def build_datasets(data_dir: str, batch_size: int, image_size: int):
    augmentation = keras.Sequential([
        layers.RandomFlip("horizontal"),
        layers.RandomRotation(0.12),
        layers.RandomZoom(0.12),
        layers.RandomContrast(0.15),
        layers.RandomBrightness(0.15),
    ], name="augmentation")

    def augment_fn(image, label):
        image = augmentation(image, training=True)
        image = tf.image.random_saturation(image, 0.75, 1.25)
        image = tf.clip_by_value(image, 0, 255)
        return image, label

    train_ds = keras.utils.image_dataset_from_directory(
        data_dir,
        validation_split=0.15,
        subset="training",
        seed=42,
        image_size=(image_size, image_size),
        batch_size=batch_size,
        label_mode="int",
    )
    val_ds = keras.utils.image_dataset_from_directory(
        data_dir,
        validation_split=0.15,
        subset="validation",
        seed=42,
        image_size=(image_size, image_size),
        batch_size=batch_size,
        label_mode="int",
    )
    class_names = train_ds.class_names

    # Compute class weights for imbalanced dataset
    print("\n[INFO] Computing class weights (scanning dataset)...")
    class_counts = {}
    for _, labels in train_ds.unbatch():
        lbl = int(labels.numpy())
        class_counts[lbl] = class_counts.get(lbl, 0) + 1
    total  = sum(class_counts.values())
    n_cls  = len(class_counts)
    class_weight = {cls: total / (n_cls * cnt) for cls, cnt in class_counts.items()}
    print(f"[INFO] Class weights computed. Total images: {total}\n")

    train_ds = train_ds.map(augment_fn, num_parallel_calls=AUTOTUNE).prefetch(AUTOTUNE)
    val_ds   = val_ds.prefetch(AUTOTUNE)
    return train_ds, val_ds, class_names, class_weight


# ============================================================================
#  MAIN
# ============================================================================
def main():
    parser = argparse.ArgumentParser(description="CPU-optimized skin disease classifier training")
    parser.add_argument("--data_dir",      required=True,           help="Path to dataset root (ImageFolder layout)")
    parser.add_argument("--output_dir",    default="./saved_model", help="Where to save model")
    parser.add_argument("--batch_size",    type=int, default=8,     help="Batch size (8 recommended for CPU)")
    parser.add_argument("--image_size",    type=int, default=IMAGE_SIZE)
    parser.add_argument("--phase1_epochs", type=int, default=12,    help="Head-only training epochs")
    parser.add_argument("--phase2_epochs", type=int, default=18,    help="Fine-tuning epochs")
    args = parser.parse_args()

    os.makedirs(args.output_dir, exist_ok=True)

    print("\n" + "="*60)
    print("  SKIN DISEASE CLASSIFIER -- CPU Training")
    print("  Model:  EfficientNetB3")
    print(f"  Input:  {args.image_size}x{args.image_size}")
    print(f"  Batch:  {args.batch_size}")
    print(f"  Output: {args.output_dir}")
    print("="*60 + "\n")

    train_ds, val_ds, class_names, class_weight = build_datasets(
        args.data_dir, args.batch_size, args.image_size
    )
    num_classes = len(class_names)
    print(f"[INFO] {num_classes} classes detected: {class_names}\n")

    # Save class labels aligned with model output order
    with open(os.path.join(args.output_dir, "class_labels.json"), "w") as f:
        json.dump(class_names, f, indent=2)
    print(f"[INFO] class_labels.json saved -> {args.output_dir}")

    # -- PHASE 1: Train head only (backbone frozen) ----------------------------
    print("\n" + "="*60)
    print("  PHASE 1: Training classification head (backbone frozen)")
    print(f"  Target: ~70-80% val accuracy in {args.phase1_epochs} epochs")
    print("="*60)

    model = build_model(num_classes=num_classes, image_size=args.image_size)
    model.summary(line_length=80)

    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=1e-3),
        loss=keras.losses.SparseCategoricalCrossentropy(),
        metrics=["accuracy"],
    )

    callbacks_p1 = [
        keras.callbacks.ModelCheckpoint(
            os.path.join(args.output_dir, "best_phase1.keras"),
            monitor="val_accuracy", save_best_only=True, verbose=1,
        ),
        keras.callbacks.EarlyStopping(
            monitor="val_accuracy", patience=5, restore_best_weights=True, verbose=1,
        ),
        keras.callbacks.ReduceLROnPlateau(
            monitor="val_loss", factor=0.5, patience=3, min_lr=1e-7, verbose=1,
        ),
        keras.callbacks.CSVLogger(os.path.join(args.output_dir, "phase1_log.csv")),
    ]

    history1 = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=args.phase1_epochs,
        callbacks=callbacks_p1,
        class_weight=class_weight,
    )

    best_p1_acc = max(history1.history.get("val_accuracy", [0]))
    print(f"\n[PHASE 1 DONE] Best val_accuracy: {best_p1_acc*100:.2f}%\n")

    # -- PHASE 2: Fine-tune top 30 backbone layers -----------------------------
    print("\n" + "="*60)
    print("  PHASE 2: Fine-tuning top 30 backbone layers")
    print(f"  Target: ~85-92% val accuracy in {args.phase2_epochs} epochs")
    print("="*60)

    base = model.get_layer("efficientnetb3")
    for layer in base.layers[-30:]:
        if not isinstance(layer, layers.BatchNormalization):
            layer.trainable = True

    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=5e-5),
        loss=focal_loss(gamma=2.0, alpha=0.25),
        metrics=["accuracy"],
    )

    callbacks_p2 = [
        keras.callbacks.ModelCheckpoint(
            os.path.join(args.output_dir, "skin_model.keras"),
            monitor="val_accuracy", save_best_only=True, verbose=1,
        ),
        keras.callbacks.EarlyStopping(
            monitor="val_accuracy", patience=6, restore_best_weights=True, verbose=1,
        ),
        keras.callbacks.ReduceLROnPlateau(
            monitor="val_loss", factor=0.4, patience=3, min_lr=1e-8, verbose=1,
        ),
        keras.callbacks.CSVLogger(os.path.join(args.output_dir, "phase2_log.csv")),
    ]

    history2 = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=args.phase2_epochs,
        callbacks=callbacks_p2,
        class_weight=class_weight,
    )

    best_p2_acc = max(history2.history.get("val_accuracy", [0]))
    print(f"\n[PHASE 2 DONE] Best val_accuracy: {best_p2_acc*100:.2f}%\n")

    # -- FINAL EVALUATION ------------------------------------------------------
    print("\n" + "="*60)
    print("  FINAL EVALUATION")
    print("="*60)

    best_model_path = os.path.join(args.output_dir, "skin_model.keras")
    if os.path.exists(best_model_path):
        model = tf.keras.models.load_model(
            best_model_path,
            custom_objects={"focal_loss": focal_loss}
        )

    loss, acc = model.evaluate(val_ds, verbose=1)
    final_acc = acc * 100
    print(f"\n[RESULT] Final Val Accuracy : {final_acc:.2f}%")
    print(f"         Final Val Loss     : {loss:.4f}")

    # Save metadata
    metadata = {
        "architecture": "EfficientNetB3",
        "image_size": args.image_size,
        "num_classes": num_classes,
        "class_names": class_names,
        "standard_val_accuracy": float(acc),
        "training_phases": 2,
        "phase1_best_val_accuracy": float(best_p1_acc),
        "phase2_best_val_accuracy": float(best_p2_acc),
        "techniques": [
            "EfficientNetB3 backbone (ImageNet pretrained)",
            "Focal loss (phase 2)",
            "Class-weighted training",
            "ReduceLROnPlateau",
            "Data augmentation",
            "Adam optimizer",
            "2-phase progressive fine-tuning",
        ],
    }
    with open(os.path.join(args.output_dir, "training_metadata.json"), "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"\n[DONE] Model saved  -> {best_model_path}")
    print(f"[DONE] Metadata     -> {os.path.join(args.output_dir, 'training_metadata.json')}")
    print(f"\n{'='*60}")
    print(f"  TRAINING COMPLETE -- Final Accuracy: {final_acc:.2f}%")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    main()
