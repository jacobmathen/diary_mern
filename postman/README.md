# Daybook: five Postman API checks

Import `Daybook.postman_collection.json` into Postman, then send the five requests in order.

Start the API first:

```powershell
Set-Location F:\Diary\backend
npm start
```

The collection uses `http://localhost:3100/api` by default. Change the `baseUrl` collection variable if `PORT` is different in the backend `.env` file.

1. **Health check** — confirms the server is running.
2. **Sign up a test account** — generates a timestamped username and email, then receives the authentication cookie.
3. **Log in to an existing account** — replace both placeholders before sending. Use this instead of signup if you want your existing diary entries.
4. **Get current user** — confirms that the `daybook_session` cookie is being sent.
5. **Create a diary entry** — creates one entry under the signed-in account.

After request 2 or 3, Postman Desktop normally stores `daybook_session` for `localhost` automatically. If requests 4 or 5 return `401`, open Postman's cookie manager, confirm the `daybook_session` cookie exists for `localhost`, then send the login request again.

The entry request uses `form-data`, which is required because the same endpoint supports optional photo uploads. To attach photos, add one or more `images` keys of type **File**; JPEG, PNG, and WebP are supported, with up to four files and 5 MB per file.

Do not add an `Origin` header in Postman. The API permits Postman's server-to-server requests without it; browser-origin rules are only for browser requests.
