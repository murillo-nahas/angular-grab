# AngularGrab

Chrome extension that lets you select context for coding agents directly from your Angular app.

Click any element to copy its component info to the clipboard — component name, host selector, test selector (`data-cy`, `data-testid`) and CSS path.

## Install

Load unpacked in `chrome://extensions` (Developer mode → Load unpacked → select this folder).

## Usage

1. Click the extension icon or open the popup and hit **Enable Picker**
2. Hover over any element on an Angular page
3. Click to copy its context
4. Press **Esc** to exit

## Output example

```
Component: AppHeader
Host: app-header
Element: <button type="submit">
Text: "Save"
Selector: [data-cy="saveButton"]
CSS Path: app-header > div.toolbar > button.btn-primary
```
