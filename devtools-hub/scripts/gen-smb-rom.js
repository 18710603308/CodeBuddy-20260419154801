// Script to download and convert Super Mario Bros ROM to TypeScript
const fs = require('fs');
const https = require('https');
const path = require('path');

const url = 'https://raw.githubusercontent.com/zdg-kinlon/FC_ROMS/main/ROM/0066/Super%20Mario%20Bros.%20(W)%20%5B!%5D.nes';
const outputPath = path.join(__dirname, 'src', 'smbRom.ts');

console.log('Downloading Super Mario Bros ROM...');

https.get(url, (res) => {
  const chunks = [];
  res.on('data', chunk => chunks.push(chunk));
  res.on('end', () => {
    const buffer = Buffer.concat(chunks);
    const arr = Array.from(buffer);
    
    // Write TypeScript file
    let content = '// Super Mario Bros ROM - NES\n';
    content += '// Size: ' + buffer.length + ' bytes\n\n';
    content += 'const SMB_ROM_DATA: number[] = [\n';
    
    for (let i = 0; i < arr.length; i += 16) {
      const line = arr.slice(i, i + 16).map(b => b.toString().padStart(3)).join(', ');
      content += '  ' + line + ',' + (i + 16 < arr.length ? '\n' : '\n');
    }
    
    content += '];\n\n';
    content += 'export const getSMBROM = (): number[] => SMB_ROM_DATA;\n';
    
    fs.writeFileSync(outputPath, content);
    console.log('ROM saved to:', outputPath);
    console.log('Size:', buffer.length, 'bytes');
  });
}).on('error', (err) => {
  console.error('Download error:', err);
});
