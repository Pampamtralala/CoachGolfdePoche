const sharp = require('sharp');
(async () => {
  const [out, hmax, ...files] = process.argv.slice(2);
  const bufs = await Promise.all(files.map(f => sharp(f).resize({ width: 390 }).toBuffer({ resolveWithObject: true })));
  const h = Math.min(+hmax, Math.max(...bufs.map(b => b.info.height)));
  const cut = await Promise.all(bufs.map(b => sharp(b.data).extract({ left: 0, top: 0, width: 390, height: Math.min(h, b.info.height) }).toBuffer()));
  await sharp({ create: { width: files.length * 398, height: h, channels: 3, background: '#666' } }).composite(cut.map((b, i) => ({ input: b, left: i * 398, top: 0 }))).png().toFile(out);
})();
