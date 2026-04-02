import { useRef, useState } from "react";
import { toPng } from "html-to-image";

const initialState = {
  name: "sasa",
  username: "sasa",
  tweet:
    "só bjo homens mais altos que eu,\ngosto de ver eles se curvando\nperante a mim",
};

function extractTweetUrl(value) {
  const match = value.match(
    /https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/[^/]+\/status\/\d+/i,
  );

  return match?.[0] ?? "";
}

function loadTwitterOEmbedJsonp(tweetUrl) {
  return new Promise((resolve, reject) => {
    const callbackName = `twitterWallpaperCallback_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2)}`;
    const script = document.createElement("script");
    const timeoutId = window.setTimeout(() => {
      cleanup();
      reject(new Error("Tempo esgotado ao buscar o tweet."));
    }, 12000);

    function cleanup() {
      delete window[callbackName];
      script.remove();
      window.clearTimeout(timeoutId);
    }

    window[callbackName] = (payload) => {
      cleanup();
      resolve(payload);
    };

    script.onerror = () => {
      cleanup();
      reject(new Error("Nao foi possivel carregar os dados do tweet."));
    };

    const query = new URLSearchParams({
      omit_script: "1",
      url: tweetUrl,
      callback: callbackName,
    });

    script.src = `https://publish.twitter.com/oembed?${query.toString()}`;
    document.body.appendChild(script);
  });
}

function parseTweetDataFromOEmbed(payload) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(payload.html ?? "", "text/html");
  const paragraph = doc.querySelector("p");
  const tweetText = paragraph?.textContent?.trim() ?? "";
  const authorUrl = payload.author_url ?? "";
  const usernameMatch = authorUrl.match(/(?:twitter\.com|x\.com)\/([^/?#]+)/i);
  const importedUsername = usernameMatch?.[1] ?? "";

  return {
    name: payload.author_name ?? "",
    username: importedUsername,
    tweet: tweetText,
  };
}

function normalizeHandle(username) {
  const raw = username.replace(/^@+/, "").trim();

  if (!raw) {
    return "username";
  }

  return raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9_ ]/g, "")
    .trim()
    .replace(/\s+/g, "");
}

function buildDisplayName(name, username) {
  const cleanName = name.trim();
  const cleanUsername = username.replace(/^@+/, "").trim();
  const fallback = cleanName || cleanUsername;
  return fallback || "Seu nome";
}

function buildInitials(name, username) {
  const cleanName = buildDisplayName(name, username);
  return cleanName.slice(0, 1).toUpperCase();
}

export default function App() {
  const [form, setForm] = useState(initialState);
  const [tweetUrl, setTweetUrl] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState("");
  const wallpaperRef = useRef(null);

  const handle = normalizeHandle(form.username);
  const displayName = buildDisplayName(form.name, form.username);
  const avatarInitial = buildInitials(form.name, form.username);
  const tweetLength = form.tweet.trim().length;

  let densityClass = "tweet-copy--large";

  if (tweetLength > 180) {
    densityClass = "tweet-copy--compact";
  } else if (tweetLength > 110) {
    densityClass = "tweet-copy--medium";
  }

  async function handleDownload() {
    if (!wallpaperRef.current) {
      return;
    }

    setIsDownloading(true);

    try {
      const dataUrl = await toPng(wallpaperRef.current, {
        cacheBust: true,
        pixelRatio: 3,
      });

      const link = document.createElement("a");
      link.download = `${handle}-wallpaper.png`;
      link.href = dataUrl;
      link.click();
    } finally {
      setIsDownloading(false);
    }
  }

  function updateField(field) {
    return (event) => {
      setForm((current) => ({
        ...current,
        [field]: event.target.value,
      }));
    };
  }

  async function handleImportTweet() {
    const validUrl = extractTweetUrl(tweetUrl);

    if (!validUrl) {
      setImportError("Cole um link valido de status do X/Twitter.");
      return;
    }

    setIsImporting(true);
    setImportError("");

    try {
      const payload = await loadTwitterOEmbedJsonp(validUrl);
      const importedData = parseTweetDataFromOEmbed(payload);

      if (!importedData.username || !importedData.tweet) {
        throw new Error("Nao foi possivel interpretar esse tweet.");
      }

      setForm({
        name: importedData.name,
        username: importedData.username,
        tweet: importedData.tweet,
      });
      setTweetUrl(validUrl);
    } catch (error) {
      setImportError(
        error instanceof Error
          ? error.message
          : "Nao foi possivel importar esse tweet.",
      );
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <main className="app-shell">
      <section className="editor-panel">
        <div className="panel-copy">
          <p className="eyebrow">Tweet Wallpaper Generator</p>
          <h1>Transforme um texto em wallpaper com estética de tweet.</h1>
          <p className="panel-description">
            Digite o username e o tweet. O preview atualiza na hora e o
            download sai em formato vertical para celular.
          </p>
        </div>

        <div className="form-card">
          <label className="field">
            <span>Link do tweet</span>
            <div className="input-action-row">
              <input
                type="text"
                placeholder="https://x.com/usuario/status/123456789"
                value={tweetUrl}
                onChange={(event) => setTweetUrl(event.target.value)}
              />
              <button
                className="secondary-button"
                type="button"
                onClick={handleImportTweet}
                disabled={isImporting}
              >
                {isImporting ? "Importando..." : "Importar"}
              </button>
            </div>
            <small className="field-help">
              Cola o link e o app tenta preencher nome e texto automaticamente.
            </small>
            {importError ? <small className="field-error">{importError}</small> : null}
          </label>

          <label className="field">
            <span>Nome exibido</span>
            <input
              type="text"
              placeholder="sasa"
              value={form.name}
              onChange={updateField("name")}
            />
          </label>

          <label className="field">
            <span>Username</span>
            <input
              type="text"
              placeholder="@sasa"
              value={form.username}
              onChange={updateField("username")}
            />
          </label>

          <label className="field">
            <span>Tweet</span>
            <textarea
              placeholder="Escreva o tweet aqui"
              rows={6}
              value={form.tweet}
              onChange={updateField("tweet")}
            />
          </label>

          <div className="meta-row">
            <div className="meta-chip">
              <strong>@{handle}</strong>
              <span>handle gerado automaticamente</span>
            </div>

            <button
              className="download-button"
              type="button"
              onClick={handleDownload}
              disabled={isDownloading}
            >
              {isDownloading ? "Gerando..." : "Baixar wallpaper"}
            </button>
          </div>
        </div>
      </section>

      <section className="preview-panel">
        <div className="phone-frame">
          <div className="wallpaper" ref={wallpaperRef}>
            <div className="tweet-header">
              <div className="avatar">{avatarInitial}</div>

              <div className="author-block">
                <p className="display-name">{displayName}</p>
                <p className="handle">@{handle}</p>
              </div>
            </div>

            <p className={`tweet-copy ${densityClass}`}>
              {form.tweet || "Seu tweet aparece aqui."}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
