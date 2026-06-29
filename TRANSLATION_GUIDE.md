# Easy translation method (full frontend)

All user-visible text should use the **language context** so the whole site changes when the user picks a language from the dropdown.

## 1. In any component or page

```js
import { useLanguage } from '../context/LanguageContext';  // adjust path

export default function MyPage() {
  const { t } = useLanguage();

  return (
    <div>
      <h1>{t('pages.myPage.title')}</h1>
      <p>{t('pages.myPage.description')}</p>
    </div>
  );
}
```

## 2. Add keys to locale files

Add the **same keys** to both:

- `frontend/src/locales/en.json`
- `backend/locales/en.json`

Example for a new page:

```json
"pages": {
  "myPage": {
    "title": "My Page Title",
    "description": "Some description text."
  }
}
```

Use **nested keys** (e.g. `pages.login.title`, `sidebar.myContacts`) to keep things organized.

## 3. That’s it

- **English:** Comes from `en.json`.
- **Other languages:** Fetched from the backend when the user selects a language; the backend uses Google Cloud Translate and caches the result.

So: **add keys to both en.json files → use `t('key')` in the component.**  
To translate a new page, add a block under `pages.*` in both locale files and use `t('pages.pageName.key')` everywhere text is shown.
