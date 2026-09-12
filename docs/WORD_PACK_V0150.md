# Word Pack v0.15.0

## Purpose
ChatGPT prepares the teaching content; Word Garden handles practice and pronunciation playback. The website does not call the OpenAI API.

## Parent workflow
1. Upload the school spelling PDF to ChatGPT.
2. Say: **Word Garden用にして**.
3. ChatGPT returns a downloadable JSON Word Pack.
4. In Word Garden → Parent → This Week, choose **Import ChatGPT Word Pack**.
5. Word Garden looks for a real U.S. English recording on Wikimedia Commons for each word.
6. Add the pack to This Week.

## JSON format
```json
{
  "format": "miori-word-garden-wordpack",
  "version": 2,
  "packTitle": "Week of Sep 14",
  "words": [
    {
      "word": "sturdy",
      "meaningEn": "strong and not easily broken",
      "meaningJa": "じょうぶな、しっかりした",
      "example": "The sturdy table can hold many books.",
      "phonicsFocus": "ur",
      "pictureCue": "🪵"
    }
  ]
}
```

`meaningEn` should preserve the school wording exactly when the PDF provides it. `meaningJa`, `example`, `phonicsFocus`, and `pictureCue` are support fields.

### Optional pre-resolved pronunciation
A pack may optionally include a human recording already found by ChatGPT:
```json
"pronunciation": {
  "url": "https://upload.wikimedia.org/.../En-us-sturdy.ogg",
  "sourcePage": "https://commons.wikimedia.org/wiki/File:En-us-sturdy.ogg",
  "source": "Wikimedia Commons",
  "license": "CC BY-SA 3.0",
  "accent": "US"
}
```
If omitted, Word Garden tries to find the recording itself.

## Audio priority
1. Human recording from Wikimedia Commons.
2. Device/browser English voice.

The slower button plays the human recording a little more slowly while preserving pitch when the browser supports it.
