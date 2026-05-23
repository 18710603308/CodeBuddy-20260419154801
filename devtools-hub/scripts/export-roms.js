import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Export tank ROM
const tankRomPath = path.join(__dirname, '../src/tankRom.ts');
const tankContent = fs.readFileSync(tankRomPath, 'utf8');
const tankMatch = tankContent.match(/export const TANK_ROM_DATA: number\[] = \[([\s\S]*?)\];/);
if (tankMatch) {
  const numbers = tankMatch[1].match(/\d+/g).map(Number);
  const buffer = Buffer.from(numbers);
  fs.writeFileSync(path.join(__dirname, '../public/roms/tank_battle.nes'), buffer);
  console.log('Exported tank_battle.nes', buffer.length, 'bytes');
}

// Export SMB ROM
const smbRomPath = path.join(__dirname, '../src/smbRom.ts');
const smbContent = fs.readFileSync(smbRomPath, 'utf8');
const smbMatch = smbContent.match(/const SMB_ROM_DATA: number\[] = \[([\s\S]*?)\];/);
if (smbMatch) {
  const numbers = smbMatch[1].match(/\d+/g).map(Number);
  const buffer = Buffer.from(numbers);
  fs.writeFileSync(path.join(__dirname, '../public/roms/super_mario.nes'), buffer);
  console.log('Exported super_mario.nes', buffer.length, 'bytes');
}
