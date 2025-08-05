---
title: "FireLensのログルーティングで数値のログレベルを使う"
date: 2025-08-03 10:00:00 +0900
draft: false
---

FireLensを使ったログルーティングで数値で表現されるログレベルを使ってルーティングをやろうとしたときに躓いたのでメモ。

## 先に結論

パース前のログ（文字列）に対して正規表現を使うことで解決しました。
```
[FILTER]
    Name    rewrite_tag
    Match   *-firelens-*
    Rule    $log .*level.*:(50|40)[,}].* $container_name.$container_id.error false

[FILTER]
    Name    rewrite_tag
    Match   *-firelens-*
    Rule    $log .*level.*:(30|20)[,}].* $container_name.$container_id.info false
```

## 困っていたポイント   

一般的にログのレベルは文字列で表されることが多いですが（例えば `INFO` や `ERROR` など）、[Fastify](https://www.fastify.dev/) など一部のフレームワークではログレベルを数値で出力するのがデフォルトになっていたりします（Fastifyでは`30`が`INFO`、`50`が`ERROR`など）。[^fn_1]

[^fn_1]: どちらかというとこれはFastifyが使っている[Pino](https://getpino.io/)というロガーの仕様。

FireLensは実質的にFluent BitなのでFastifyなどの構造化されたログをJSONでパースするなどの機能があり、パース後のログレベルをもとに`rewrite_tag`を使ったルーティングを書いていたのですが何故か動きませんでした。

動かなかったコンフィグ（一部抜粋）
```
[FILTER]
    Name    rewrite_tag
    Match   *-firelens-*
    Rule    $level ^(50|40)$ $container_name.$container_id.error false

[FILTER]
    Name    rewrite_tag
    Match   *-firelens-*
    Rule    $level ^(30|20)$ $container_name.$container_id.info false
```

これでうまくいきそうですがタグが書き換わらず後段のルーティングが正しくできませんでした。

## なぜ動かなかったのか

数値で表現されるログレベルをパースするとFluent Bitの内部的には数値としてデータを持ちますが、regexは文字列に対するマッチングを行うため、数値のフィールドに対しては正規表現を使うことができませんでした。

{{< webcard "https://github.com/fluent/fluent-bit/issues/6284" >}}

似たような問題はGitHubのIssueに報告されていますが"Not planned"となっていてFluent Bit側で何かしらの解決策が提示されることはなさそうです。

## 解決方法

この問題の解決のために先程のIssueではluaスクリプトを使ったルーティングが提案されていましたが、luaスクリプトを使うためには自前でDockerイメージを作成する必要があってせっかくのFireLensの手軽さ（S3からコンフィグを読むだけで自前でイメージを作成する手間が省ける）が活かせません。

そのためデフォルトのFluent Bitの機能を使って数値のログレベルを扱える方法がないか試行錯誤していましたが、パース前のログに対して正規表現を使うことで解決しました。[^fn_2]

[^fn_2]: こんな脳筋な方法で解決していいのか…みたいところは少しある

パース前のログがこのような形式なので
```json
{"level":50,"time":"2025-07-24T10:00:00.000Z","msg":"error message"}
```

```regex
.*level.*:(50|40)[,}].*
```
の正規表現を使うことで数値のログレベルを含むログを文字列としてマッチさせ、ルーティングを行うことができました。

## まとめ
FireLensを使ったログルーティングで数値のログレベルを使う場合はパース後のログレベル（数値）ではなく、パース前のログ（文字列）に対して正規表現を使う必要がありそうです。

ちなみに素直に文字列でログレベルを出力すればもっと素直なルーティングが書けるので、まず最初にログ形式を変えることを検討するのが良いかもしれません。

（今回の要件ではログレベルのフォーマットを変えたくないとのことだったのでこの形を採用しました）