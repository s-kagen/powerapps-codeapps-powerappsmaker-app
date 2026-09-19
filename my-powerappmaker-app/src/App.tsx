import { useCallback, useEffect, useMemo, useState } from "react";
import "./App.css";

import { PowerAppsforMakersService } from "./generated/services/PowerAppsforMakersService";
import type { PowerApp } from "./generated/models/PowerAppsforMakersModel";

type FilterType = "all" | "favorite" | "shared";
type SortType = "modified-desc" | "modified-asc" | "name-asc";

const formatDate = (value?: string): string => {
  if (!value) {
    return "情報なし";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const isFavoriteApp = (app: PowerApp): boolean => {
  return app.properties?.userAppMetadata?.favorite === "true";
};

const isSharedApp = (app: PowerApp): boolean => {
  const userCount = app.properties?.sharedUsersCount ?? 0;
  const groupCount = app.properties?.sharedGroupsCount ?? 0;

  return userCount > 0 || groupCount > 0;
};

const getDisplayName = (app: PowerApp): string => {
  return app.properties?.displayName || app.name || "名前のないアプリ";
};

const getOwnerName = (app: PowerApp): string => {
  return (
    app.properties?.owner?.displayName ||
    app.properties?.createdBy?.displayName ||
    "所有者情報なし"
  );
};

const getInitial = (text: string): string => {
  const target = text.trim();

  if (!target) {
    return "A";
  }

  return target.substring(0, 1).toUpperCase();
};

const AppIcon = ({ color }: { color?: string }) => (
  <div
    className="app-icon"
    style={{
      background: `linear-gradient(145deg, ${
        color || "#0f6cbd"
      }, #004e8c)`,
    }}
    aria-hidden="true"
  >
    <svg viewBox="0 0 24 24">
      <rect
        x="4"
        y="4"
        width="16"
        height="16"
        rx="4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M8 9h8M8 12h5M8 15h7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  </div>
);

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle
      cx="11"
      cy="11"
      r="7"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    />
    <path
      d="m16 16 4 4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

const RefreshIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M20 7v5h-5M4 17v-5h5M18 10a7 7 0 0 0-12-3L4 9m2 5a7 7 0 0 0 12 3l2-2"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ExternalLinkIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M14 5h5v5M19 5l-8 8M18 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

function App() {
  const [apps, setApps] = useState<PowerApp[]>([]);
  const [selectedApp, setSelectedApp] = useState<PowerApp | null>(null);

  const [searchText, setSearchText] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [sort, setSort] = useState<SortType>("modified-desc");

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadApps = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      /*
       * Get_Apps(
       *   api_version?: string,
       *   $filter?: string,
       *   $top?: number
       * )
       */
      const result = await PowerAppsforMakersService.Get_Apps(
        undefined,
        undefined,
        100,
      );

      const appList = result.data?.value ?? [];

      setApps(appList);
      setLastUpdated(new Date());

      setSelectedApp((current) => {
        if (!current) {
          return null;
        }

        return appList.find((app) => app.id === current.id) ?? null;
      });
    } catch (error) {
      console.error("Power Appsの取得に失敗しました。", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Power Appsの取得中にエラーが発生しました。",
      );

      setApps([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadApps();
  }, [loadApps]);

  const filteredApps = useMemo(() => {
    const keyword = searchText.trim().toLocaleLowerCase("ja-JP");

    const result = apps.filter((app) => {
      const properties = app.properties;

      const searchableValues = [
        properties?.displayName,
        properties?.description,
        properties?.owner?.displayName,
        properties?.owner?.email,
        properties?.createdBy?.displayName,
        properties?.environment?.name,
        app.name,
        app.type,
      ];

      const matchesKeyword =
        keyword.length === 0 ||
        searchableValues.some((value) =>
          String(value ?? "")
            .toLocaleLowerCase("ja-JP")
            .includes(keyword),
        );

      const matchesFilter =
        filter === "all" ||
        (filter === "favorite" && isFavoriteApp(app)) ||
        (filter === "shared" && isSharedApp(app));

      return matchesKeyword && matchesFilter;
    });

    return [...result].sort((a, b) => {
      if (sort === "name-asc") {
        return getDisplayName(a).localeCompare(getDisplayName(b), "ja");
      }

      const aTime = new Date(
        a.properties?.lastModifiedTime ?? 0,
      ).getTime();

      const bTime = new Date(
        b.properties?.lastModifiedTime ?? 0,
      ).getTime();

      if (sort === "modified-asc") {
        return aTime - bTime;
      }

      return bTime - aTime;
    });
  }, [apps, filter, searchText, sort]);

  const favoriteCount = useMemo(
    () => apps.filter(isFavoriteApp).length,
    [apps],
  );

  const sharedCount = useMemo(
    () => apps.filter(isSharedApp).length,
    [apps],
  );

  const recentlyUpdatedCount = useMemo(() => {
    const threshold = Date.now() - 30 * 24 * 60 * 60 * 1000;

    return apps.filter((app) => {
      const value = app.properties?.lastModifiedTime;

      if (!value) {
        return false;
      }

      const time = new Date(value).getTime();

      return !Number.isNaN(time) && time >= threshold;
    }).length;
  }, [apps]);

  const openApp = (app: PowerApp) => {
    const url = app.properties?.appOpenUri;

    if (!url) {
      return;
    }

    window.open(url, "_blank", "noopener,noreferrer");
  };

  const resetFilters = () => {
    setSearchText("");
    setFilter("all");
    setSort("modified-desc");
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">PA</div>

          <div>
            <span className="brand-label">MAKER WORKSPACE</span>
            <h1>Power Apps 開発者アプリ</h1>
          </div>
        </div>

        <div className="topbar-actions">
          <span className="connection-status">
            <span className="status-dot" />
            コネクター接続済み
          </span>

          <button
            type="button"
            className="button button-secondary"
            onClick={() => void loadApps()}
            disabled={isLoading}
          >
            <RefreshIcon />
            {isLoading ? "更新中" : "最新情報に更新"}
          </button>
        </div>
      </header>

      <main className="main-content">
        <section className="hero">
          <div className="hero-content">
            <span className="hero-label">POWER APPS CATALOG</span>

            <h2>
              アプリを見つける。
              <br />
              次の開発を始める。
            </h2>

            <p>
              環境内のPower Appsをすばやく検索し、所有者、共有状況、
              更新日時などの開発情報を一画面で確認できます。
            </p>

            <div className="search-box">
              <SearchIcon />

              <input
                type="search"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="アプリ名、所有者、環境名で検索"
                aria-label="アプリを検索"
              />

              {searchText && (
                <button
                  type="button"
                  className="search-clear"
                  onClick={() => setSearchText("")}
                  aria-label="検索文字をクリア"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          <div className="hero-decoration" aria-hidden="true">
            <div className="decoration-circle circle-one" />
            <div className="decoration-circle circle-two" />

            <div className="code-window">
              <div className="code-window-header">
                <span />
                <span />
                <span />
              </div>

              <div className="code-window-body">
                <span className="code-line code-line-long" />
                <span className="code-line code-line-medium" />
                <span className="code-line code-line-short" />
                <span className="code-line code-line-long" />
                <span className="code-line code-line-medium" />
              </div>
            </div>
          </div>
        </section>

        <section className="stats-grid" aria-label="アプリ統計">
          <article className="stat-card">
            <div className="stat-icon stat-icon-blue">01</div>
            <div>
              <span>すべてのアプリ</span>
              <strong>{apps.length}</strong>
              <small>取得したアプリ数</small>
            </div>
          </article>

          <article className="stat-card">
            <div className="stat-icon stat-icon-cyan">02</div>
            <div>
              <span>お気に入り</span>
              <strong>{favoriteCount}</strong>
              <small>登録済みアプリ</small>
            </div>
          </article>

          <article className="stat-card">
            <div className="stat-icon stat-icon-indigo">03</div>
            <div>
              <span>共有アプリ</span>
              <strong>{sharedCount}</strong>
              <small>ユーザーまたはグループ共有</small>
            </div>
          </article>

          <article className="stat-card">
            <div className="stat-icon stat-icon-green">04</div>
            <div>
              <span>最近の更新</span>
              <strong>{recentlyUpdatedCount}</strong>
              <small>過去30日以内</small>
            </div>
          </article>
        </section>

        <section className="catalog">
          <div className="catalog-heading">
            <div>
              <span className="section-label">APP CATALOG</span>
              <h2>アプリカタログ</h2>

              <p>
                {filteredApps.length}件を表示
                {lastUpdated &&
                  ` ・ 最終取得 ${lastUpdated.toLocaleTimeString(
                    "ja-JP",
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                    },
                  )}`}
              </p>
            </div>
          </div>

          <div className="toolbar">
            <div className="filter-buttons">
              <button
                type="button"
                className={filter === "all" ? "active" : ""}
                onClick={() => setFilter("all")}
              >
                すべて
              </button>

              <button
                type="button"
                className={filter === "favorite" ? "active" : ""}
                onClick={() => setFilter("favorite")}
              >
                お気に入り
              </button>

              <button
                type="button"
                className={filter === "shared" ? "active" : ""}
                onClick={() => setFilter("shared")}
              >
                共有アプリ
              </button>
            </div>

            <label className="sort-box">
              <span>並び替え</span>

              <select
                value={sort}
                onChange={(event) =>
                  setSort(event.target.value as SortType)
                }
              >
                <option value="modified-desc">
                  更新日時が新しい順
                </option>
                <option value="modified-asc">
                  更新日時が古い順
                </option>
                <option value="name-asc">アプリ名順</option>
              </select>
            </label>
          </div>

          {isLoading && (
            <div className="state-panel" role="status">
              <div className="spinner" />
              <strong>Power Appsを読み込んでいます</strong>
              <p>コネクターから最新情報を取得しています。</p>
            </div>
          )}

          {!isLoading && errorMessage && (
            <div className="state-panel error-panel" role="alert">
              <div className="state-icon">!</div>
              <strong>アプリを取得できませんでした</strong>
              <p>{errorMessage}</p>

              <button
                type="button"
                className="button button-primary"
                onClick={() => void loadApps()}
              >
                もう一度試す
              </button>
            </div>
          )}

          {!isLoading &&
            !errorMessage &&
            filteredApps.length === 0 && (
              <div className="state-panel">
                <div className="empty-search-icon">
                  <SearchIcon />
                </div>

                <strong>条件に一致するアプリがありません</strong>
                <p>検索文字または絞り込み条件を変更してください。</p>

                <button
                  type="button"
                  className="button button-secondary"
                  onClick={resetFilters}
                >
                  条件をリセット
                </button>
              </div>
            )}

          {!isLoading &&
            !errorMessage &&
            filteredApps.length > 0 && (
              <div className="app-grid">
                {filteredApps.map((app) => {
                  const properties = app.properties;
                  const ownerName = getOwnerName(app);
                  const userCount = properties?.sharedUsersCount ?? 0;
                  const groupCount =
                    properties?.sharedGroupsCount ?? 0;

                  return (
                    <article
                      className="app-card"
                      key={app.id || app.name}
                    >
                      <div className="app-card-header">
                        <AppIcon
                          color={properties?.backgroundColor}
                        />

                        <div className="badge-container">
                          {isFavoriteApp(app) && (
                            <span className="badge badge-favorite">
                              お気に入り
                            </span>
                          )}

                          {isSharedApp(app) && (
                            <span className="badge badge-shared">
                              共有
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="app-card-content">
                        <span className="app-type">
                          {app.type || "Power App"}
                        </span>

                        <h3>{getDisplayName(app)}</h3>

                        <p>
                          {properties?.description ||
                            "このアプリには説明が登録されていません。"}
                        </p>
                      </div>

                      <dl className="app-meta">
                        <div>
                          <dt>環境</dt>
                          <dd>
                            {properties?.environment?.name ||
                              "環境情報なし"}
                          </dd>
                        </div>

                        <div>
                          <dt>最終更新</dt>
                          <dd>
                            {formatDate(
                              properties?.lastModifiedTime,
                            )}
                          </dd>
                        </div>
                      </dl>

                      <div className="share-summary">
                        <span>ユーザー共有 {userCount}</span>
                        <span>グループ共有 {groupCount}</span>
                      </div>

                      <div className="owner-row">
                        <div className="owner-avatar">
                          {getInitial(ownerName)}
                        </div>

                        <div>
                          <span>所有者</span>
                          <strong>{ownerName}</strong>
                        </div>
                      </div>

                      <div className="card-actions">
                        <button
                          type="button"
                          className="button button-secondary card-detail"
                          onClick={() => setSelectedApp(app)}
                        >
                          詳細を見る
                        </button>

                        <button
                          type="button"
                          className="icon-button"
                          onClick={() => openApp(app)}
                          disabled={!properties?.appOpenUri}
                          aria-label={`${getDisplayName(
                            app,
                          )}を開く`}
                          title={
                            properties?.appOpenUri
                              ? "アプリを開く"
                              : "起動URIがありません"
                          }
                        >
                          <ExternalLinkIcon />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
        </section>
      </main>

      <footer className="footer">
        <strong>Power Apps 開発者アプリ</strong>
        <span>Power Apps Code Apps</span>
      </footer>

      {selectedApp && (
        <div
          className="drawer-backdrop"
          onMouseDown={() => setSelectedApp(null)}
        >
          <aside
            className="detail-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="detail-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="drawer-header">
              <div className="drawer-title">
                <AppIcon
                  color={selectedApp.properties?.backgroundColor}
                />

                <div>
                  <span>{selectedApp.type || "Power App"}</span>
                  <h2 id="detail-title">
                    {getDisplayName(selectedApp)}
                  </h2>
                </div>
              </div>

              <button
                type="button"
                className="drawer-close"
                onClick={() => setSelectedApp(null)}
                aria-label="詳細パネルを閉じる"
              >
                ×
              </button>
            </div>

            <div className="drawer-content">
              <section className="detail-section">
                <span className="detail-label">概要</span>
                <p>
                  {selectedApp.properties?.description ||
                    "説明は登録されていません。"}
                </p>
              </section>

              <section className="detail-section">
                <span className="detail-label">アプリ情報</span>

                <dl className="detail-list">
                  <div>
                    <dt>アプリID</dt>
                    <dd>{selectedApp.id || "情報なし"}</dd>
                  </div>

                  <div>
                    <dt>内部名</dt>
                    <dd>{selectedApp.name || "情報なし"}</dd>
                  </div>

                  <div>
                    <dt>バージョン</dt>
                    <dd>
                      {selectedApp.properties?.appVersion ||
                        "情報なし"}
                    </dd>
                  </div>

                  <div>
                    <dt>環境</dt>
                    <dd>
                      {selectedApp.properties?.environment?.name ||
                        "情報なし"}
                    </dd>
                  </div>

                  <div>
                    <dt>作成日時</dt>
                    <dd>
                      {formatDate(
                        selectedApp.properties?.createdTime,
                      )}
                    </dd>
                  </div>

                  <div>
                    <dt>最終更新日時</dt>
                    <dd>
                      {formatDate(
                        selectedApp.properties?.lastModifiedTime,
                      )}
                    </dd>
                  </div>
                </dl>
              </section>

              <section className="detail-section">
                <span className="detail-label">所有者</span>

                <div className="detail-owner">
                  <div className="detail-owner-avatar">
                    {getInitial(getOwnerName(selectedApp))}
                  </div>

                  <div>
                    <strong>{getOwnerName(selectedApp)}</strong>
                    <span>
                      {selectedApp.properties?.owner?.email ||
                        selectedApp.properties?.createdBy?.email ||
                        "メール情報なし"}
                    </span>
                  </div>
                </div>
              </section>

              <section className="detail-section">
                <span className="detail-label">共有状況</span>

                <div className="share-detail-grid">
                  <div>
                    <strong>
                      {selectedApp.properties?.sharedUsersCount ??
                        0}
                    </strong>
                    <span>共有ユーザー</span>
                  </div>

                  <div>
                    <strong>
                      {selectedApp.properties?.sharedGroupsCount ??
                        0}
                    </strong>
                    <span>共有グループ</span>
                  </div>
                </div>
              </section>
            </div>

            <div className="drawer-footer">
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setSelectedApp(null)}
              >
                閉じる
              </button>

              <button
                type="button"
                className="button button-primary"
                onClick={() => openApp(selectedApp)}
                disabled={!selectedApp.properties?.appOpenUri}
              >
                アプリを開く
                <ExternalLinkIcon />
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

export default App;