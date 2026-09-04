# Platform read-API contract

citewire turns a news platform into MCP tools by wrapping its read API. Any site
that exposes the three endpoints below can be served through the `news.list`,
`news.get`, `news.topics`, and `news.about` tools with a single `platform` block
in the config:

```json
{
  "platform": {
    "name": "Example Newswire",
    "siteUrl": "https://news.example.org",
    "apiBase": "https://news.example.org/api/v1/news"
  }
}
```

`apiBase` is the root of the read API. The three endpoints hang off it. The tools
are a mechanical projection of these endpoints, so the MCP surface cannot drift
from the API it wraps.

Implementations should publish an OpenAPI document for the three read-only
endpoints so operators can verify the contract independently.

All three endpoints are read-only `GET` requests and return JSON. citewire sends
`Accept: application/json` and a descriptive `User-Agent`, and applies a 15
second timeout.

---

## `GET {apiBase}` — list

Backs `news.list`. Returns published items, newest first.

### Query parameters

All are optional. citewire forwards only the parameters the caller supplies.

| Parameter   | Type    | Notes                                                            |
| ----------- | ------- | ---------------------------------------------------------------- |
| `topic`     | string  | Topic taxonomy slug (see the topics endpoint).                   |
| `industry`  | string  | Industry taxonomy slug.                                          |
| `q`         | string  | Free-text search.                                                |
| `days`      | integer | Posted-within window. Supported values: `1`, `7`, `30`.          |
| `cursor`    | string  | Opaque `next_cursor` from a previous response (keyset paging).   |
| `page_size` | integer | Items per page, 1 to 50.                                         |

### Response body

A JSON object with:

| Field           | Type            | Notes                                                         |
| --------------- | --------------- | ------------------------------------------------------------- |
| `items`         | array           | The page of news items, newest first.                         |
| `page_size`     | integer         | The page size applied to this response.                       |
| `max_page_size` | integer         | The largest page size the API will honor.                     |
| `next_cursor`   | string or null  | Pass back as `cursor` for the next page. `null` when the last page is reached. |

Each entry in `items` carries at least a `slug` (the key `news.get` looks up)
along with the item's title, publish date, attribution, and a link to the
original article.

## `GET {apiBase}/{slug}` — detail

Backs `news.get`. Returns one published item identified by its `slug`, including
attribution and related coverage. The `slug` is URL-encoded before the request
is sent.

## `GET {apiBase}/topics` — taxonomy

Backs `news.topics`. Returns the active taxonomy topics. Each topic carries a
`slug`, a `label`, and a `description`. The slugs are the values accepted by the
`topic` filter on the list endpoint.

---

## Errors

A non-2xx response is mapped to a readable tool error rather than a protocol
fault. When the response body is an RFC 7807 problem document, citewire uses its
`detail` field in the error message, so a platform that returns problem bodies
gives agent callers a clear reason for the failure.

## Attribution

Every item a platform returns is expected to credit its original publisher and
link to the original article. citewire reads and relays that metadata. It does
not store or republish the underlying content, and the `news.about` tool states
the attribution policy explicitly so a client can read it back.
