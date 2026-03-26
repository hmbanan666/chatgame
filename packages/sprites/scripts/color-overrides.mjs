/**
 * Manual color → palette overrides for characters whose original colors
 * don't map cleanly to Resurrect 64 via nearest-distance snapping.
 *
 * Only needed when two different original colors would snap to the same
 * palette color (collision), losing visual detail.
 *
 * Format: { codename: { originalHexColor: 'paletteName' } }
 */
export const COLOR_OVERRIDES = {
  banana: {
    0xEFB923: 'gold', // body shadow → gold (was colliding with bright body → yellow1)
  },
  pup: {
    0x482714: 'darkPurple', // darkest brown → darkPurple (was colliding with mid brown → darkBrown)
    0xD3B99B: 'tan', // light muzzle → tan (was snapping to grayGreen4)
  },
  shape: {
    0x20BFFF: 'lightBlue', // brightest blue → lightBlue (was colliding with 2 others → blue3)
    0x229CD4: 'teal3', // mid blue → teal3 (was colliding → blue3)
  },
  wooly: {
    0x281409: 'darkPurple', // darkest → outline (always dark)
    0x3E200F: 'darkRed', // dark-mid → darkRed
    0x482714: 'brown1', // mid → brown1
    0x5D3721: 'brown2', // light brown → brown2
    0xDAA264: 'gold', // golden accent → gold
    0xFFC27F: 'cream', // lightest → cream
  },
}
