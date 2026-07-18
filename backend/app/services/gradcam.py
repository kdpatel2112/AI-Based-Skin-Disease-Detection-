"""
Grad-CAM explainability: produces a heatmap over the input image highlighting
which regions most influenced the model's predicted class.

Reference: Selvaraju et al., "Grad-CAM: Visual Explanations from Deep
Networks via Gradient-based Localization" (2017).
"""
import cv2
import numpy as np
import tensorflow as tf


def find_last_conv_layer(model: tf.keras.Model) -> str:
    for layer in reversed(model.layers):
        if len(layer.output_shape) == 4:
            return layer.name
    raise ValueError("No convolutional layer found for Grad-CAM.")


def make_gradcam_heatmap(img_array: np.ndarray, model: tf.keras.Model, class_index: int, last_conv_layer_name: str | None = None) -> np.ndarray:
    if last_conv_layer_name is None:
        last_conv_layer_name = find_last_conv_layer(model)

    grad_model = tf.keras.models.Model(
        model.inputs, [model.get_layer(last_conv_layer_name).output, model.output]
    )

    with tf.GradientTape() as tape:
        conv_outputs, predictions = grad_model(img_array)
        loss = predictions[:, class_index]

    grads = tape.gradient(loss, conv_outputs)
    pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))

    conv_outputs = conv_outputs[0]
    heatmap = conv_outputs @ pooled_grads[..., tf.newaxis]
    heatmap = tf.squeeze(heatmap)
    heatmap = tf.maximum(heatmap, 0) / (tf.math.reduce_max(heatmap) + 1e-8)
    return heatmap.numpy()


def overlay_heatmap_on_image(original_image_bgr: np.ndarray, heatmap: np.ndarray, alpha: float = 0.45) -> np.ndarray:
    heatmap_resized = cv2.resize(heatmap, (original_image_bgr.shape[1], original_image_bgr.shape[0]))
    heatmap_uint8 = np.uint8(255 * heatmap_resized)
    heatmap_color = cv2.applyColorMap(heatmap_uint8, cv2.COLORMAP_JET)
    overlaid = cv2.addWeighted(heatmap_color, alpha, original_image_bgr, 1 - alpha, 0)
    return overlaid


def generate_synthetic_heatmap(image_shape: tuple[int, int]) -> np.ndarray:
    """
    Fallback used only when running with the mock predictor (no trained model
    present). Produces a plausible, centrally-weighted heatmap purely for UI
    demonstration purposes — it carries no diagnostic meaning.
    """
    h, w = image_shape
    y, x = np.ogrid[:h, :w]
    cy, cx = h * 0.5, w * 0.5
    sigma = min(h, w) * 0.28
    heatmap = np.exp(-(((x - cx) ** 2 + (y - cy) ** 2) / (2 * sigma ** 2)))
    return heatmap / (heatmap.max() + 1e-8)
