import { useRef, useState } from "react";
import { toPng } from "html-to-image";

const initialState = {
  name: "",
  username: "",
  tweet: "",
  timestamp: "",
  profileImageUrl: "",
};

function buildCurrentTimestamp() {
  const now = new Date();
  const time = new Intl.DateTimeFormat("pt-BR", {
    hour: "numeric",
    minute: "2-digit",
  }).format(now);
  const date = new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(now);

  return `${time} · ${date}`;
}

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
  const footerLink = doc.querySelector("a:last-of-type");
  const tweetText = paragraph?.textContent?.trim() ?? "";
  const authorUrl = payload.author_url ?? "";
  const usernameMatch = authorUrl.match(/(?:twitter\.com|x\.com)\/([^/?#]+)/i);
  const importedUsername = usernameMatch?.[1] ?? "";
  const importedDate = footerLink?.textContent?.trim() ?? buildCurrentTimestamp();

  return {
    name: payload.author_name ?? "",
    username: importedUsername,
    tweet: tweetText,
    timestamp: importedDate,
    profileImageUrl: buildAvatarUrl(importedUsername),
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
  return cleanName || cleanUsername;
}

function buildInitials(name, username) {
  return buildDisplayName(name, username).slice(0, 1).toUpperCase();
}

function buildAvatarUrl(username) {
  const handle = normalizeHandle(username);
  if (!username.trim() || handle === "username") {
    return "";
  }

  return `https://unavatar.io/x/${handle}`;
}

function XLogo() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="brand-mark">
      <path
        fill="currentColor"
        d="M18.244 2H21l-6.76 7.728L22 22h-6.172l-4.835-6.938L4.92 22H2.16l7.23-8.27L2 2h6.328l4.37 6.274L18.244 2Zm-2.158 18h1.528L7.498 3.896H5.86Z"
      />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="tweet-menu-icon">
      <path
        fill="currentColor"
        d="M3 12c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2Zm7 0c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2Zm7 0c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2Z"
      />
    </svg>
  );
}

function ReplyIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path
        fill="currentColor"
        d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.42 0 8.005 3.58 8.005 8s-3.584 8-8.005 8H9.756a7.97 7.97 0 0 1-3.248-.687l-3.75 1.427a.75.75 0 0 1-.98-.94l1.07-3.48A7.96 7.96 0 0 1 1.75 10Zm8.005-6.5A6.5 6.5 0 0 0 4.91 14.31a.75.75 0 0 1 .13.664l-.657 2.135 2.296-.873a.75.75 0 0 1 .603.024 6.47 6.47 0 0 0 2.474.49h4.366a6.5 6.5 0 1 0 0-13Z"
      />
    </svg>
  );
}

function RetweetIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path
        fill="currentColor"
        d="m4.5 3.75 4 4-1.06 1.06-2.19-2.19V16a2.75 2.75 0 0 0 2.75 2.75h7.19l-2.19-2.19 1.06-1.06 4 4-4 4-1.06-1.06 2.19-2.19H8A4.25 4.25 0 0 1 3.75 16V6.62L1.56 8.81.5 7.75l4-4Zm11.5.5A4.25 4.25 0 0 1 20.25 8v9.38l2.19-2.19 1.06 1.06-4 4-4-4 1.06-1.06 2.19 2.19V8A2.75 2.75 0 0 0 16 5.25H8.81L11 7.44l-1.06 1.06-4-4 4-4L11 1.56 8.81 3.75H16Z"
      />
    </svg>
  );
}

function LikeIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path
        fill="currentColor"
        d="M16.697 3.074c-1.723 0-3.191.81-4.196 2.09-1.004-1.28-2.473-2.09-4.196-2.09C4.742 3.074 2 5.932 2 9.377c0 1.943.767 3.72 2.146 5.423 1.303 1.61 3.195 3.2 5.363 5.021l2.52 2.116a.75.75 0 0 0 .965 0l2.52-2.116c2.168-1.82 4.06-3.41 5.363-5.021C21.233 13.097 22 11.32 22 9.377c0-3.445-2.742-6.303-5.303-6.303Zm0 1.5c1.63 0 3.803 1.945 3.803 4.803 0 1.503-.589 2.946-1.808 4.451-1.211 1.495-3.013 3.012-5.104 4.768L12.5 19.51l-1.088-.914c-2.091-1.756-3.893-3.273-5.104-4.768C5.089 12.323 4.5 10.88 4.5 9.377c0-2.858 2.173-4.803 3.803-4.803 1.52 0 2.857 1.003 3.554 2.54a.75.75 0 0 0 1.366 0c.697-1.537 2.034-2.54 3.474-2.54Z"
      />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path
        fill="currentColor"
        d="M17.53 2.47a.75.75 0 0 1 1.06 0l3.94 3.94a.75.75 0 0 1 0 1.06l-3.94 3.94-1.06-1.06 2.66-2.66h-6.44A9.25 9.25 0 0 0 4.5 16.94v2.31h-1.5v-2.31a10.75 10.75 0 0 1 10.75-10.75h6.44l-2.66-2.66 1.06-1.06ZM7 10.75h1.5v6.5A2.25 2.25 0 0 0 10.75 19.5h8.5A2.25 2.25 0 0 0 21.5 17.25v-6.5H23v6.5A3.75 3.75 0 0 1 19.25 21h-8.5A3.75 3.75 0 0 1 7 17.25v-6.5Z"
      />
    </svg>
  );
}

export default function App() {
  const [form, setForm] = useState(initialState);
  const [tweetUrl, setTweetUrl] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState("");
  const [avatarFailed, setAvatarFailed] = useState(false);
  const wallpaperRef = useRef(null);

  const handle = normalizeHandle(form.username);
  const displayName = buildDisplayName(form.name, form.username);
  const avatarInitial = buildInitials(form.name, form.username) || "?";
  const avatarUrl = form.profileImageUrl || buildAvatarUrl(form.username);
  const tweetLength = form.tweet.trim().length;
  const hasName = Boolean(displayName);
  const hasHandle = Boolean(form.username.trim());
  const hasTweet = Boolean(form.tweet.trim());
  const hasTimestamp = Boolean(form.timestamp.trim());

  let densityClass = "tweet-copy--large";

  if (tweetLength > 210) {
    densityClass = "tweet-copy--compact";
  } else if (tweetLength > 130) {
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
      const { value } = event.target;

      setForm((current) => {
        if (field === "username") {
          return {
            ...current,
            username: value,
            profileImageUrl: buildAvatarUrl(value),
          };
        }

        return {
          ...current,
          [field]: value,
        };
      });

      if (field === "username") {
        setAvatarFailed(false);
      }
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

      setAvatarFailed(false);
      setForm(importedData);
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
          <h1>Wallpaper com a mesma leitura visual de um tweet real.</h1>
          <p className="panel-description">
            O cartão agora fica centralizado na tela, com borda, espaçamento e
            hierarquia visual inspirados no layout do X/Twitter.
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
              O link preenche nome, @handle, texto e data visível do embed.
            </small>
            {importError ? (
              <small className="field-error">{importError}</small>
            ) : null}
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
              placeholder="@samssmaria"
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

          <label className="field">
            <span>Data / hora exibida</span>
            <input
              type="text"
              placeholder="20:12 · 2 de abr. de 2026"
              value={form.timestamp}
              onChange={updateField("timestamp")}
            />
          </label>

          <div className="meta-row">
            <div className="meta-chip">
              <strong>@{handle}</strong>
              <span>avatar é preenchido junto com a importação</span>
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
            <article className="tweet-card">
              <header className="tweet-header">
                <div className="avatar-shell">
                  {avatarUrl && !avatarFailed ? (
                    <img
                      key={avatarUrl}
                      className="avatar-image"
                      src={avatarUrl}
                      alt=""
                      crossOrigin="anonymous"
                      referrerPolicy="no-referrer"
                      onError={() => setAvatarFailed(true)}
                    />
                  ) : null}
                  <div
                    className={`avatar-fallback${
                      avatarFailed || !avatarUrl ? " visible" : ""
                    }`}
                  >
                    {avatarInitial}
                  </div>
                </div>

                <div className="author-block">
                  <div className="author-primary-row">
                    <p className={`display-name${hasName ? "" : " is-placeholder"}`}>
                      {displayName || "Nome"}
                    </p>
                  </div>
                  <p className={`handle${hasHandle ? "" : " is-placeholder"}`}>
                    @{hasHandle ? handle : "username"}
                  </p>
                </div>

                <div className="tweet-header-actions">
                  <XLogo />
                  <MoreIcon />
                </div>
              </header>

              <p
                className={`tweet-copy ${densityClass}${
                  hasTweet ? "" : " tweet-copy--placeholder"
                }`}
              >
                {hasTweet ? form.tweet : "Cole um link ou escreva o tweet"}
              </p>

              <p className={`tweet-timestamp${hasTimestamp ? "" : " is-placeholder"}`}>
                {hasTimestamp ? form.timestamp : "Data e hora"}
              </p>

              <div className="tweet-divider" />

              <footer className="tweet-actions" aria-hidden="true">
                <span className="tweet-action">
                  <ReplyIcon />
                </span>
                <span className="tweet-action">
                  <RetweetIcon />
                </span>
                <span className="tweet-action">
                  <LikeIcon />
                </span>
                <span className="tweet-action">
                  <ShareIcon />
                </span>
              </footer>
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}
