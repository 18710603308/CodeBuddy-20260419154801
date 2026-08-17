export interface InvMusicTrack {
  name: string
  artist: string
  src: string
}

/**
 * 请柬内置背景音乐播放列表（网易云音乐外链直链，国内 CDN，稳定可播放）
 *
 * - 《24 小时摇滚聚会》：刺猬乐队原版（网易云 id=348107，已验证可播放）
 * - 《APT.》：原版（ROSÉ & Bruno Mars）受版权/VIP 限制公开试听接口无法直链，
 *   使用网易云上可正常播放的翻唱版本（id=2714755782，已验证可播放）保证轮播稳定
 */
export const INVITATION_PLAYLIST: InvMusicTrack[] = [
  {
    name: '24 小时摇滚聚会',
    artist: '刺猬乐队',
    src: 'https://music.163.com/song/media/outer/url?id=348107.mp3',
  },
  {
    name: 'APT.',
    artist: 'ROSÉ & Bruno Mars',
    src: 'https://music.163.com/song/media/outer/url?id=2714755782.mp3',
  },
]
