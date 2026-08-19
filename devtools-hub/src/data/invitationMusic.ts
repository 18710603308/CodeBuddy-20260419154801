export interface InvMusicTrack {
  name: string
  artist: string
  src: string
}

/**
 * 请柬内置背景音乐播放列表（网易云音乐外链直链，国内 CDN，稳定可播放）
 *
 * - 《执子之手》在前：默认进入页面即播放（宝石Gem/哩哩 原版 id=1995495104 为 VIP 收费
 *   歌曲，公开试听接口仅返回 30 秒片段，故使用网易云上可完整播放的
 *   Cover 版本 id=3381679941（王六一，完整 3 分 11 秒，已验证））
 * - 《24 小时摇滚聚会》：刺猬乐队原版（网易云 id=348107，已验证可播放）轮播第二首
 */
export const INVITATION_PLAYLIST: InvMusicTrack[] = [
  {
    name: '执子之手',
    artist: '宝石Gem/哩哩（Cover 王六一）',
    src: 'https://music.163.com/song/media/outer/url?id=3381679941.mp3',
  },
  {
    name: '24 小时摇滚聚会',
    artist: '刺猬乐队',
    src: 'https://music.163.com/song/media/outer/url?id=348107.mp3',
  },
]
