export interface InvMusicTrack {
  name: string
  artist: string
  src: string
}

/**
 * 请柬默认背景音乐（单曲循环）：
 * 《执子之手》宝石Gem/哩哩 —— 进入页面即播放，播放完重播，不自动切歌。
 * （原版 id=1995495104 为 VIP 收费歌曲，公开试听接口仅返回 30 秒片段，
 *   故使用网易云上可完整播放的 Cover 版本 id=3381679941（王六一，完整 3 分 11 秒））
 */
export const INVITATION_DEFAULT_TRACK: InvMusicTrack = {
  name: '执子之手',
  artist: '宝石Gem/哩哩（Cover 王六一）',
  src: 'https://music.163.com/song/media/outer/url?id=3381679941.mp3',
}

/**
 * 可选歌单：仅当用户手动点「上一首 / 下一首」时才会切换播放，不会自动轮播。
 *
 * - 《APT.》：ROSÉ & Bruno Mars 原版受版权/VIP 限制，使用网易云可正常播放的
 *   翻唱版本 id=2714755782
 * - 《24 小时摇滚聚会》：刺猬乐队原版（网易云 id=348107，已验证可播放）
 */
export const INVITATION_OPTIONAL_TRACKS: InvMusicTrack[] = [
  {
    name: 'APT.',
    artist: 'ROSÉ & Bruno Mars（Cover）',
    src: 'https://music.163.com/song/media/outer/url?id=2714755782.mp3',
  },
  {
    name: '24 小时摇滚聚会',
    artist: '刺猬乐队',
    src: 'https://music.163.com/song/media/outer/url?id=348107.mp3',
  },
]

/**
 * 完整可切换歌单（默认曲目 + 可选曲目 + 请柬自定义音乐）。
 * 默认 `trackIndex = 0` 即《执子之手》；单曲循环由播放逻辑保证。
 */
export const INVITATION_PLAYLIST: InvMusicTrack[] = [
  INVITATION_DEFAULT_TRACK,
  ...INVITATION_OPTIONAL_TRACKS,
]
