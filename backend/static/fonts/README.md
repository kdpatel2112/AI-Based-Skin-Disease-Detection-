# Noto Fonts — Required for Hindi/Gujarati PDF Generation

This directory stores Unicode TTF font files needed to render Hindi (Devanagari)
and Gujarati scripts in PDF reports.

## How to Download

Visit **https://fonts.google.com/noto** and download:

1. **Noto Sans Devanagari** → place `NotoSansDevanagari-Regular.ttf` here
2. **Noto Sans Gujarati** → place `NotoSansGujarati-Regular.ttf` here

## Direct Download Links

```
# Devanagari (Hindi)
https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSansDevanagari/NotoSansDevanagari-Regular.ttf

# Gujarati
https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSansGujarati/NotoSansGujarati-Regular.ttf
```

## Quick Setup (PowerShell)

```powershell
# Run from the backend directory:
$fontsDir = "backend\static\fonts"

Invoke-WebRequest `
  -Uri "https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSansDevanagari/NotoSansDevanagari-Regular.ttf" `
  -OutFile "$fontsDir\NotoSansDevanagari-Regular.ttf"

Invoke-WebRequest `
  -Uri "https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSansGujarati/NotoSansGujarati-Regular.ttf" `
  -OutFile "$fontsDir\NotoSansGujarati-Regular.ttf"
```

## Notes

- Without these fonts, the PDF generator will gracefully fall back to **Helvetica**,
  which cannot render Devanagari/Gujarati glyphs (they will appear as ☐ boxes).
- These fonts are open-source under the **SIL Open Font License (OFL)**.
- The fonts are not committed to the repo due to file size (~500KB each).
