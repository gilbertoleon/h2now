//Dependencias
import gulp from "gulp";
import dartSass from "sass";
import gulpSass from "gulp-sass";
import merge from "merge2";
import sourcemaps from "gulp-sourcemaps";
import autoprefixer from "gulp-autoprefixer";
import concat from "gulp-concat";
import minify from "gulp-minifier";
import del from "del";
import imagemin from "gulp-imagemin";
import htmlreplace from "gulp-html-replace";
const sass = gulpSass(dartSass);

//Rutas: Estilo {dir1,dir2,...,dir3} para un listado con opciones
var sassFiles = "src/scss/**/*.scss";
var cssDest = "src/css";

var cssMin = ["src/css/estilo.css"];
cssMin = ["src/css/estilo.css"];

var cssFinal = "estilo.css";
var cssFinalMin = "estilo.min.css";
var cssDep = cssMin.slice(0, cssMin.length - 1);
if (cssDep.length == 0) {
  cssDep = "[]";
}
var cssDepMin = "dependencias.min.css";

//Rutas: Aplicación
var jsDest = "src/js";
var dtsDest = "src/dts";
var jsMin = [
  "src/js/setup/setup.js",
  "src/js/charts/**/*.js",
  "src/js/main/**/*.js",
];
var jsFinalMin = "aplicacion.min.js";
var jsSrc = "aplicacion.js";
var jsDep = ["node_modules/d3/dist/d3.js", "src/js/utils/**/*.js"];

var jsDepMin = "dependencias.min.js";

//Rutas: Documento
var htmlFiles = "src/**/*.html";

//Rutas: Imágenes
var imgFiles = "src/img/**/*";

//Rutas: Assets
var assetFiles = [
  "src/assets/**/*",
  "src/csv/**/*.csv",
  "src/tsv/**/*.tsv",
  "src/json/**/*.json",
];

//Inicialización de objetos

//Tareas: sass
gulp.task("sass", function () {
  return gulp
    .src(sassFiles)
    .pipe(sourcemaps.init())
    .pipe(sass().on("error", sass.logError))
    .pipe(concat(cssFinal))
    .pipe(autoprefixer())
    .pipe(sourcemaps.write(""))
    .pipe(gulp.dest(cssDest));
});

//Tareas: minifyDepCSS
gulp.task("minifyDepCSS", function () {
  return gulp
    .src(cssDep, { allowEmpty: true })
    .pipe(sourcemaps.init())
    .pipe(concat(cssDepMin))
    .pipe(
      minify({
        minify: true,
        collapseWhitespace: true,
        minifyCSS: true,
      })
    )
    .pipe(sourcemaps.write(""))
    .pipe(gulp.dest("src/css"));
});

//Tareas: minifyDepJS
gulp.task("minifyDepJS", function () {
  return gulp
    .src(jsDep)
    .pipe(sourcemaps.init())
    .pipe(concat(jsDepMin))
    .pipe(
      minify({
        minify: true,
        collapseWhitespace: true,
        minifyJS: true,
      })
    )
    .pipe(sourcemaps.write(""))
    .pipe(gulp.dest("src/js"));
});

//Tareas: compileJS
gulp.task("compileJS", function () {
  return gulp
    .src(jsMin)
    .pipe(sourcemaps.init())
    .pipe(concat(jsSrc))
    .pipe(sourcemaps.write(""))
    .pipe(gulp.dest("src/js"));
});

gulp.task("watchChanges", function (done) {
  gulp.watch(sassFiles, gulp.series("sass"));
  gulp.watch(jsMin, gulp.series("compileJS"));
  done();
});

//Tareas: init
gulp.task(
  "init",
  gulp.series(
    "minifyDepCSS",
    "minifyDepJS",
    "sass",
    "compileJS",
    "watchChanges"
  )
);

//Tareas clean
gulp.task("clean", function (done) {
  del.sync("dist/**");
  done();
});

//Tareas: minifyCSS
gulp.task("minifyCSS", function () {
  return gulp
    .src(cssMin)
    .pipe(sourcemaps.init())
    .pipe(concat(cssFinalMin))
    .pipe(
      minify({
        minify: true,
        minifyCSS: {
          collapseWhitespace: true,
          conservativeCollapse: true,
          decodeEntities: true,
          removeComments: true,
        },
      })
    )
    .pipe(sourcemaps.write(""))
    .pipe(gulp.dest("dist/css"));
});

//Tareas: minifyJS
gulp.task("minifyJS", function () {
  return gulp
    .src(jsDep.concat(jsMin))
    .pipe(sourcemaps.init())
    .pipe(concat(jsFinalMin))
    .pipe(
      minify({
        minify: true,
        minifyJS: true,
      })
    )
    .pipe(sourcemaps.write(""))
    .pipe(gulp.dest("dist/js"));
});

//Tareas: minifyHTML
gulp.task("minifyHTML", function () {
  return gulp
    .src(htmlFiles)
    .pipe(
      htmlreplace({
        css: "css/estilo.min.css",
        js: "js/aplicacion.min.js",
      })
    )
    .pipe(
      minify({
        minify: true,
        minifyHTML: {
          collapseWhitespace: true,
          conservativeCollapse: true,
          decodeEntities: true,
          removeComments: true,
        },
      })
    )
    .pipe(gulp.dest("dist"));
});

//Tarea: images
gulp.task("images", function () {
  return gulp.src(imgFiles).pipe(imagemin()).pipe(gulp.dest("dist/img"));
});

//Tareas: copyAssets
gulp.task("copyAssets", function () {
  return gulp
    .src(assetFiles, {
      base: "src",
    })
    .pipe(gulp.dest("dist"));
});

//Tareas: build
gulp.task(
  "build",
  gulp.series(
    "clean",
    "sass",
    "minifyCSS",
    "minifyJS",
    "minifyHTML",
    "images",
    "copyAssets"
  )
);

//Tarea por defecto
gulp.task("default", gulp.series("build"));
