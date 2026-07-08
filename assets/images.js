/**
 * High-quality stock imagery (Unsplash) for Last Chance Lighting.
 * Free to use under the Unsplash License.
 */
(function () {
  var q = function (w) {
    return '?auto=format&fit=crop&w=' + w + '&q=85';
  };

  var base = 'https://images.unsplash.com/photo-';

  window.SITE_IMAGES = {
  hero: {
    residential: base + '1616486338812-ee82856726eb' + q(1920),
    commercial: base + '1497366216548-37526070297c' + q(1920),
    outdoor: base + '1600585154340-be6161a56a0c' + q(1920),
    construction: base + '1541888946425-d81bb19240f5' + q(1920)
  },
  categories: {
    chandeliers: base + '1618221195710-dd6b41faaea6' + q(1200),
    led: base + '1555685813-73e1da995c48' + q(1200),
    wall: base + '1518174590768-f3879938e229' + q(1200),
    outdoor: base + '1600607687939-ce8a6c25118c' + q(1200),
    industrial: base + '1565688534245-05d6bfcb0fbf' + q(1200),
    smart: base + '1558006238-8aafaa8b8741' + q(1200)
  },
  products: {
    decorativePendant: base + '1513506003901-1e6a229e2d15' + q(1200),
    decorativeWall: base + '1524484486085-49f666bbb496' + q(1200),
    decorativeChandelier: base + '1565814636199-cc884c4d42b0' + q(1200),
    decorativeCeiling: base + '1631679706909-d4aac2a782f9' + q(1200),
    residentialDownlight: base + '1600210492486-724fe3c67dea' + q(1200),
    residentialBedroom: base + '1616597760505-2be7fd7b8cb8' + q(1200),
    residentialKitchen: base + '1556911220-bff31c812dba' + q(1200),
    residentialLedStrip: base + '1555685813-73e1da995c48' + q(1200),
    commercialOffice: base + '1497366811353-4683cca0d9d4' + q(1200),
    commercialPanel: base + '1486406146926-c627a92ad1ab' + q(1200),
    commercialTrack: base + '1542744094-24638eff166c' + q(1200),
    commercialPendant: base + '1600607687644-c7171b42498b' + q(1200),
    outdoorBollard: base + '1416339346331-b87679b85e3f' + q(1200),
    outdoorFlood: base + '1513581166391-887a96ddeafd' + q(1200),
    outdoorStep: base + '1600566753190-17f0baa2a6d3' + q(1200),
    outdoorGarden: base + '1558904541-efa843a96f01' + q(1200),
    outdoorWall: base + '1600607687920-4e2a09cf159d' + q(1200),
    outdoorInGround: base + '1600585152915-d208bec867a1' + q(1200)
  },
  industries: {
    hotels: base + '1566073771259-6a8506099945' + q(1200),
    education: base + '1523050854058-8df84110a0a2' + q(1200),
    shipping: base + '1494412571407-34c0fcd6d4d0' + q(1200),
    banking: base + '1486406146926-c627a92ad1ab' + q(1200),
    homeowners: base + '1600585154526-990dced655db' + q(1200)
  }
  };
})();
