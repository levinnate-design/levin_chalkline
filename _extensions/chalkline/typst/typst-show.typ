// Passes document settings (title, fonts, brand colors, logos) into the
// `article` layout defined in typst-template.typ. Replaces Quarto's default.
#show: doc => article(
$if(title)$
  title: [$title$],
$endif$
$if(subtitle)$
  subtitle: [$subtitle$],
$endif$
$if(doc-type)$
  doc-type: [$doc-type$],
$endif$
$if(edition)$
  edition: [$edition$],
$endif$
$if(name-box)$
  name-box: true,
$endif$
$if(layout)$
  layout: "$layout$",
$endif$
$if(poster-theme)$
  poster-theme: "$poster-theme$",
$endif$
$if(hide-title)$
  poster-title: false,
$endif$
$if(poster-center)$
  poster-center: true,
$endif$
$if(playful-theme)$
  playful-theme: "$playful-theme$",
$endif$
$if(lang)$
  lang: "$lang$",
$endif$
$if(brand.typography.base.family)$
  font: $brand.typography.base.family$,
$endif$
$if(brand.typography.base.size)$
  fontsize: $brand.typography.base.size$,
$endif$
$if(brand.typography.headings.family)$
  heading-family: $brand.typography.headings.family$,
$endif$
  colors: brand-color,
  logos: brand-logo-images,
$if(school)$
  school: [$school$],
$endif$
  doc,
)
