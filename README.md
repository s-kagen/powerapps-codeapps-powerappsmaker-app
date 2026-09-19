# Power Apps 開発者アプリ

Power Apps Code Apps と「作成者向け Power Apps」コネクターを利用して開発した、Power Apps 開発者向けのダッシュボードアプリです。

Power Platform 環境内のアプリを一覧表示し、アプリの検索、所有者確認、共有状況の把握、更新状況の確認を一画面で実現します。

---

## 概要

開発者や管理者が日常的に利用する Power Apps を効率よく管理することを目的としたアプリです。

アプリのメタデータを取得し、視認性の高いカード形式で表示することで、環境内のアプリ状況を素早く把握できます。

---

## 主な機能

### アプリ一覧表示

- Power Apps 一覧を取得
- アプリ名表示
- 説明表示
- 所有者表示
- 環境表示
- 作成日時表示
- 最終更新日時表示

### 検索機能

以下の条件で高速検索が可能です。

- アプリ名
- 所有者
- メールアドレス
- 環境名
- 説明文

### フィルター機能

#### すべて

すべてのアプリを表示します。

#### お気に入り

お気に入り登録されているアプリのみ表示します。

#### 共有アプリ

ユーザーまたはグループへ共有されているアプリのみ表示します。

---

## 統計ダッシュボード

画面上部に主要な統計情報を表示します。

- すべてのアプリ数
- お気に入りアプリ数
- 共有アプリ数
- 最近更新されたアプリ数

---

## アプリ詳細表示

アプリカードを選択すると詳細情報を表示します。

### 表示項目

- アプリ ID
- 内部名
- アプリ バージョン
- 所有者
- 環境
- 作成日時
- 更新日時
- 共有ユーザー数
- 共有グループ数

---

## アプリ起動

取得した App Open URI を利用して、対象アプリを直接起動できます。

---

## 利用コネクター

### 作成者向け Power Apps

利用サービス：

```typescript
PowerAppsforMakersService
```

利用操作：

```typescript
Get_Apps()
```

---

## 使用モデル

```typescript
PowerApp
```

主な利用プロパティ：

```typescript
properties.displayName
properties.description
properties.owner
properties.createdBy
properties.environment
properties.createdTime
properties.lastModifiedTime
properties.sharedUsersCount
properties.sharedGroupsCount
properties.appVersion
properties.appOpenUri
properties.backgroundColor
properties.userAppMetadata.favorite
```

---

## 技術スタック

### フロントエンド

- React
- TypeScript
- Vite

### UI

- カスタム CSS
- レスポンシブデザイン
- Microsoft Fluent Design ベース

### データアクセス

- Power Apps Code Apps
- Microsoft Power Platform Connector
- 作成者向け Power Apps API

---

## 画面構成

### ホーム

Power Apps 開発者アプリのダッシュボード画面

### 検索

キーワード検索

### 統計

Power Apps 利用状況サマリー

### アプリカタログ

アプリ一覧表示

### 詳細パネル

対象アプリの詳細情報表示

---

## 特徴

### モダンな UI

- Microsoft 365 ライクなデザイン
- ブルーを基調としたブランドカラー
- カードレイアウト採用

### レスポンシブ対応

- PC
- タブレット
- スマートフォン

に対応しています。

### 高速検索

取得済みデータに対してクライアントサイド検索を実施し、ストレスのない操作感を実現しています。

---

## セットアップ

### パッケージのインストール

```bash
npm install
```

### 開発実行

```bash
npm run dev
```

### ビルド

```bash
npm run build
```

---

## 想定利用者

- Power Platform 管理者
- Power Apps 開発者
- Center of Excellence 担当者
- システム管理者
- テナント管理者


