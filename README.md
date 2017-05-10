gulp-aws
========

## gulp-aws/lib/cognito

cognito.settings.json

```json
{
  "IdentityPoolName": "<IdentityPoolName>",
  "AllowUnauthenticatedIdentities": true,
  "AuthenticatedRole": "<arn::IAM>",
  "UnAuthenticatedRole": "<arn::IAM>"
}
```

gulpfile.js

```js
const gulp = require("gulp");
const cognito = require("gulp-aws/lib/cognito");

gulp.task("cognito", function() {
  return gulp.src("src/**/cognito.settings.json")
    .pipe(cognito())
    .pipe(gulp.dest("build/Release/result.json"));
});
```
