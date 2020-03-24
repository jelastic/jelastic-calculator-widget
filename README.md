# Jelastic Signup Widget

This widget is created specifically for easy installation on any page and does not require any additional dependencies. It bases on usual HTML, js, and CSS installed in all modern browsers. The initialization of the widget is in the background and does not appear at the page load speed. User email validation based on [default HTML5 email validation](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/email#Validation).

# Widget Installation

Insert this code anywhere on the page, where you want to display the widget:
```html
  <div class="jlc-wrapper"></div>
```

Get `jlcwidget.css` and `jlcwidget.js` files in the `dist` folder and put it in your template folder on the server.

Replace `PATH_TO_TEMPLATE` in the example below with your theme template path and insert it after `<head>` and before `</body>` tag anywhere in your theme template.

```html
  <script async src="PATH_TO_TEMPLATE/jlcwidget.js"></script>
  <link rel="stylesheet" href="PATH_TO_TEMPLATE/jlcwidget.css" media="none" onload="if(media!='all')media='all'">
```

# Widget Customisation

You can add the following attributes to `<div class="jlc-wrapper"></div>` to redefine localization and target platform:

- `data-text` - main button label
- `data-tx-success` - success text
- `data-tx-error` - error text
- `data-key` - hoster domain

```html
  <div class="jlc-wrapper" data-text="GET STARTED FOR FREE" data-tx-success="CHECK YOUR EMAIL" data-tx-error="An error has occurred, please try again later" data-key="jelastichosting.nl"></div>
```

The default localization and hoster domain values are defined in the "main variables" section of the `assets/js/jlcwidget.js` file:

```JavaScript
const jlc_button_text = wrapper.getAttribute('data-text') || 'GET STARTED FOR FREE';

const jlc_text_error = wrapper.getAttribute('data-tx-error') || 'An error has occurred, please try again later',
jlc_text_success = wrapper.getAttribute('data-tx-success') || 'CHECK YOUR EMAIL',
jlc_hoster_domain = wrapper.getAttribute('data-key') || 'jelastichosting.nl';
```

You can customize this widget with a build system based on Gulp with [SCSS](https://sass-lang.com) preprocessor.

### Features
* CSS Autoprefixing
* Built-in preview server with BrowserSync
* Compile Sass with libsass
* Lint and minifyscripts
* Image optimization

### Getting Started

Requires [Node.js](https://nodejs.org/) v6+ and [Gulp](https://gulpjs.com/) v4+ to run.

- Install Gulp: `npm install gulp --global`
- [Clone localy](https://confluence.atlassian.com/bitbucket/clone-a-repository-223217891.html) `git clone https://github.com/jelastic/jelastic-widget.git`
- Go to project folder `cd jelastic-widget`
- Install dependencies `npm install -d`
- Run `gulp serve` to start the server and watch for changes
- Run `gulp default` to build for production environments

You can change CSS in the `assets/css/jlcwidget.scss` file, for example default variables:

```scss
$color-blue : #0088fb; // default color (blue)
$color-green : #00bea7; // default color for green button
$color-gray : #efefef;
$color-medium : #6b758a;
$color-dark : #5e6981;
$color-red : red; // default error color

$bdrs: 10px; // button border radius
$width: 280px; // default button size (if you change it, pay attention to font-size of the `.jlc-btn` and `.jlc-input` selectors)
$font-family: 'Open Sans', sans-serif;
```

After the build, you will have the following files in the `dist` folder:

- `index.html` example with widget initialization selector
- `jlcwidget.js` minified JavaScript
- `jlcwidget.css` minified CSS

#### Change images

For the best performance all images saved in the SVG format, optimized with [svgomg service](https://jakearchibald.github.io/svgomg/) and included to the CSS/SCSS with BASE64 technology via [base64encode.org](https://www.base64encode.org/).

Non converted images you can find in `assets/img/` folder.
