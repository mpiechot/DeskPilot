from pathlib import Path
from math import sin, cos, radians

OUT = Path(__file__).parent / 'roman-laurel-shield.svg'
parts = ['''<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1000" height="1000" viewBox="0 0 1000 1000" fill="none">
<title>Scutum within a golden laurel wreath</title>
<desc>Editable vector illustration. Red convex Roman-inspired military shield with brass edging, winged thunderbolt decoration and a polished central boss, framed by individually positioned curved laurel leaves. Transparent background.</desc>
<defs>
  <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1" gradientUnits="objectBoundingBox"><stop stop-color="#66401c"/><stop offset=".24" stop-color="#c99339"/><stop offset=".46" stop-color="#f4d78d"/><stop offset=".63" stop-color="#d3a249"/><stop offset="1" stop-color="#785021"/></linearGradient>
  <linearGradient id="leaf-lit" x1="0" y1="1" x2="1" y2="0"><stop stop-color="#815623"/><stop offset=".3" stop-color="#c1913c"/><stop offset=".66" stop-color="#edce83"/><stop offset="1" stop-color="#fff0b8"/></linearGradient>
  <linearGradient id="leaf-dark" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#b8802d"/><stop offset=".5" stop-color="#9b6828"/><stop offset="1" stop-color="#64431e"/></linearGradient>
  <linearGradient id="red" x1="350" y1="0" x2="650" y2="0" gradientUnits="userSpaceOnUse"><stop stop-color="#4a101a"/><stop offset=".19" stop-color="#901f2a"/><stop offset=".46" stop-color="#c44542"/><stop offset=".58" stop-color="#ab2d33"/><stop offset=".86" stop-color="#791923"/><stop offset="1" stop-color="#390e19"/></linearGradient>
  <linearGradient id="shield-shade" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#f49565" stop-opacity=".15"/><stop offset=".45" stop-color="#f49565" stop-opacity="0"/><stop offset="1" stop-color="#180a13" stop-opacity=".4"/></linearGradient>
  <radialGradient id="boss" cx=".32" cy=".24" r=".76"><stop stop-color="#fff3c8"/><stop offset=".2" stop-color="#e8ce8e"/><stop offset=".48" stop-color="#be923f"/><stop offset=".72" stop-color="#79501e"/><stop offset=".89" stop-color="#4b341b"/><stop offset="1" stop-color="#c29748"/></radialGradient>
  <radialGradient id="rivet" cx=".3" cy=".2"><stop stop-color="#fff0bd"/><stop offset=".45" stop-color="#d2ab60"/><stop offset="1" stop-color="#694820"/></radialGradient>
  <linearGradient id="ribbon" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#e7c575"/><stop offset=".45" stop-color="#b58533"/><stop offset=".53" stop-color="#f4d997"/><stop offset="1" stop-color="#936526"/></linearGradient>
  <g id="leaf">
    <path d="M0 0 C-6-20-1-51 12-77 C19-92 23-101 24-112 C39-94 44-70 35-45 C28-24 12-8 0 0Z" fill="url(#leaf-lit)" stroke="#805820" stroke-width=".9"/>
    <path d="M0 0 C16-31 22-65 24-112 C39-94 44-70 35-45 C28-24 12-8 0 0Z" fill="url(#leaf-dark)"/>
    <path d="M2-4 C15-31 23-67 24-105" stroke="#fff0ba" stroke-opacity=".7" stroke-width="1.3" stroke-linecap="round"/>
    <path d="M10-23 Q5-32 3-43 M16-40 Q9-51 11-61 M21-61 Q17-72 19-83" stroke="#fff1bd" stroke-opacity=".34" stroke-width=".9"/>
    <path d="M11-26 Q24-32 31-44 M18-48 Q30-54 36-68 M22-71 Q31-78 33-88" stroke="#482f16" stroke-opacity=".35" stroke-width=".9"/>
    <path d="M4-15 C-1-36 5-63 16-85" stroke="#ffe7a2" stroke-opacity=".35" stroke-width="1"/>
  </g>
  <g id="wing">
    <path d="M468 480 C451 456 418 439 383 421 C386 439 401 453 425 464 C410 460 397 455 388 448 C393 465 411 477 433 482 C416 481 404 477 396 473 C403 489 421 497 444 496 C432 500 419 499 410 497 C422 509 439 511 461 503 L481 494Z" fill="#4a111b" opacity=".55" transform="translate(1 3)"/>
    <path d="M468 480 C451 456 418 439 383 421 C386 439 401 453 425 464 C410 460 397 455 388 448 C393 465 411 477 433 482 C416 481 404 477 396 473 C403 489 421 497 444 496 C432 500 419 499 410 497 C422 509 439 511 461 503 L481 494Z" fill="url(#gold)" stroke="#f4d084" stroke-width="1"/>
    <path d="M394 434 Q438 454 463 485 M402 458 Q430 477 459 488 M411 481 Q437 493 457 493" stroke="#7c4e20" stroke-width="1.5"/>
    <path d="M395 432 Q439 451 465 482" stroke="#ffe8a6" stroke-opacity=".65" stroke-width="1"/>
  </g>
</defs>
<g id="laurel-wreath">''']

# Leaves follow each branch; their individual transforms keep each editable.
for side, sign in [('left', -1), ('right', 1)]:
    parts.append(f'<g id="{side}-branch">')
    for i, a in enumerate(range(-59, 66, 12)):
        t = radians(a)
        x, y = 500 + sign * 304 * cos(t), 477 - 342 * sin(t)
        tangent = sign * -a
        size = .83 + .11 * cos(t)
        for kind, angle, scale in [('outer', tangent + sign*40, size), ('inner', tangent - sign*32, size*.82)]:
            parts.append(f'<use id="{side}-{kind}-leaf-{i+1}" xlink:href="#leaf" transform="translate({x:.2f} {y:.2f}) rotate({angle:.2f}) scale({sign*scale:.3f} {scale:.3f})"/>')
    parts.append('</g>')
parts.append('''<g id="branches" stroke-linecap="round">
<path d="M527 853 C419 827 268 736 215 620 C151 482 182 309 358 155 M473 853 C581 827 732 736 785 620 C849 482 818 309 642 155" stroke="#69471f" stroke-width="9"/>
<path d="M527 851 C419 825 270 735 217 620 C154 481 184 310 358 155 M473 851 C581 825 730 735 783 620 C846 481 816 310 642 155" stroke="url(#gold)" stroke-width="6"/>
<path d="M523 849 C419 820 275 733 221 620 C162 484 184 321 345 169 M477 849 C581 820 725 733 779 620 C838 484 816 321 655 169" stroke="#f8df99" stroke-opacity=".7" stroke-width="1.5"/>
</g></g>
<g id="scutum">
  <path d="M351 276 Q500 231 649 276 L658 705 Q500 757 342 705Z" fill="#352019" opacity=".18" transform="translate(0 9)"/>
  <path d="M351 270 Q500 225 649 270 L658 699 Q500 751 342 699Z" fill="url(#gold)" stroke="#51391d" stroke-width="3"/>
  <path d="M361 280 Q500 240 639 280 L647 690 Q500 736 353 690Z" fill="url(#red)" stroke="#5b351e" stroke-width="2"/>
  <path d="M361 280 Q500 240 639 280 L647 690 Q500 736 353 690Z" fill="url(#shield-shade)"/>
  <path d="M355 271 Q500 231 645 271 M347 697 Q500 744 653 697" stroke="#fff1b6" stroke-opacity=".85" stroke-width="2"/>
  <path d="M364 288 Q500 249 636 288 L643 685 Q500 728 357 685Z" stroke="#ecb76a" stroke-opacity=".62" stroke-width="1.5"/>
  <path d="M374 299 Q500 264 626 299 M367 675 Q500 715 633 675" stroke="#dfb065" stroke-width="2"/>
  <path d="M496 275 Q479 452 495 704" stroke="#ffba8c" stroke-opacity=".13" stroke-width="3"/>
  <g id="winged-thunderbolt">
    <use xlink:href="#wing"/><use xlink:href="#wing" transform="translate(1000 0) scale(-1 1)"/>
    <use xlink:href="#wing" transform="translate(0 990) scale(1 -1)"/><use xlink:href="#wing" transform="translate(1000 990) scale(-1 -1)"/>
    <path d="M504 321 L476 386 L492 382 L479 443 L519 367 L502 373 L520 321Z M496 665 L524 600 L508 604 L521 543 L481 619 L498 613 L480 665Z" fill="url(#gold)" stroke="#edcf89" stroke-width="1"/>
    <path d="M500 307 L500 298 M490 310 L485 304 M510 310 L515 304 M500 679 L500 688 M490 676 L485 682 M510 676 L515 682" stroke="#ddb771" stroke-width="2" stroke-linecap="round"/>
  </g>
  <g id="shield-boss">
    <rect x="449" y="443" width="106" height="106" rx="8" fill="#330e16" opacity=".4" transform="translate(2 5)"/>
    <rect x="447" y="441" width="106" height="106" rx="8" fill="url(#gold)" stroke="#593d20" stroke-width="2"/>
    <rect x="452" y="446" width="96" height="96" rx="5" stroke="#f3d78f" stroke-opacity=".7"/>
    <circle cx="500" cy="494" r="45" fill="#674620" stroke="#f1d492" stroke-width="2"/>
    <circle cx="500" cy="494" r="39" fill="url(#boss)" stroke="#70491d" stroke-width="1.5"/>
    <path d="M468 486 A33 33 0 0 1 506 462" stroke="#fff3c3" stroke-opacity=".7" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M477 523 A36 36 0 0 0 535 489" stroke="#e9c171" stroke-opacity=".5" stroke-width="1.5"/>
''')
for x in [458,542]:
    for y in [452,536]:
        parts.append(f'<circle cx="{x}" cy="{y}" r="3.5" fill="url(#rivet)" stroke="#65461f" stroke-width=".7"/>')
parts.append('</g><g id="rim-rivets">')
for i in range(8):
    y=299+i*53
    for x in [356-(y-299)*.021,644+(y-299)*.021]:
        parts.append(f'<circle cx="{x:.2f}" cy="{y}" r="2.5" fill="url(#rivet)"/>')
parts.append('''</g></g>
<g id="wreath-binding">
  <path d="M484 829 Q464 850 441 874 L465 873 L474 893 Q489 867 500 848Z" fill="url(#ribbon)" stroke="#785221" stroke-width="1.3"/>
  <path d="M516 829 Q536 850 559 874 L535 873 L526 893 Q511 867 500 848Z" fill="url(#ribbon)" stroke="#785221" stroke-width="1.3"/>
  <path d="M476 829 Q500 837 524 829 L520 852 Q500 861 480 852Z" fill="url(#gold)" stroke="#755020" stroke-width="1.5"/>
  <path d="M483 832 L486 852 M494 835 L496 855 M506 835 L506 855 M518 832 L515 852" stroke="#f9df9c" stroke-opacity=".75" stroke-width="2"/>
  <path d="M480 850 Q500 858 520 850" stroke="#62411c" stroke-width="1"/>
</g>
</svg>''')
OUT.write_text('\n'.join(parts), encoding='utf-8')
print(OUT.resolve())
