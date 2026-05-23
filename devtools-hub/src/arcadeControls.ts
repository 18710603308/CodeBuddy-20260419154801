// 街机默认按键映射 - 符合国内街机模拟器习惯（游聚/约战风格）
// FBNeo Classic 设备类型下的 RetroArch Joypad ID 与街机按钮映射：
//   id 0 (RetroPad B)  = Arcade Btn 1 (A/轻拳)
//   id 8 (RetroPad A)  = Arcade Btn 2 (B/轻脚)
//   id 1 (RetroPad Y)  = Arcade Btn 3 (C/重拳)
//   id 9 (RetroPad X)  = Arcade Btn 4 (D/重脚)
//   id 10 (RetroPad L) = Arcade Btn 5
//   id 11 (RetroPad R) = Arcade Btn 6
//   id 2 (SELECT) = Coin (投币)
//   id 3 (START)  = Start (开始)
//   id 4-7 = D-pad (方向键)

export const ARCADE_CONTROLS = {
  0: {
    // 方向键
    4: { value: 'up arrow', value2: 'DPAD_UP' },
    5: { value: 'down arrow', value2: 'DPAD_DOWN' },
    6: { value: 'left arrow', value2: 'DPAD_LEFT' },
    7: { value: 'right arrow', value2: 'DPAD_RIGHT' },
    // 投币 & 开始
    2: { value: '5', value2: 'COIN' },
    3: { value: '1', value2: 'START' },
    // 动作键 (J-K-U-I 布局：J=轻拳, K=轻脚, U=重拳, I=重脚)
    0: { value: 'j', value2: 'BUTTON_2' },   // B 键 → Btn1 轻拳(J)
    8: { value: 'k', value2: 'BUTTON_1' },   // A 键 → Btn2 轻脚(K)
    1: { value: 'u', value2: 'BUTTON_4' },   // Y 键 → Btn3 重拳(U)
    9: { value: 'i', value2: 'BUTTON_3' },   // X 键 → Btn4 重脚(I)
    10: { value: 'o', value2: 'LEFT_TOP_SHOULDER' },
    11: { value: 'p', value2: 'RIGHT_TOP_SHOULDER' },
  },
  // 玩家2 (WASD + 小键盘)
  1: {
    4: { value: 'w', value2: 'DPAD_UP' },
    5: { value: 's', value2: 'DPAD_DOWN' },
    6: { value: 'a', value2: 'DPAD_LEFT' },
    7: { value: 'd', value2: 'DPAD_RIGHT' },
    2: { value: '6', value2: 'COIN' },
    3: { value: '2', value2: 'START' },
    0: { value: 'numpad 1', value2: 'BUTTON_2' },   // B → Btn1 轻拳
    8: { value: 'numpad 2', value2: 'BUTTON_1' },   // A → Btn2 轻脚
    1: { value: 'numpad 4', value2: 'BUTTON_4' },   // Y → Btn3 重拳
    9: { value: 'numpad 5', value2: 'BUTTON_3' },   // X → Btn4 重脚
    10: { value: 'numpad 7', value2: 'LEFT_TOP_SHOULDER' },
    11: { value: 'numpad 8', value2: 'RIGHT_TOP_SHOULDER' },
  },
  2: {},
  3: {},
}
