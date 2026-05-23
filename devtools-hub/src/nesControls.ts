// NES/FC 默认按键映射
// RetroArch Joypad ID 映射 (fceumm):
//   id 0 = B 按钮
//   id 8 = A 按钮
//   id 2 = SELECT (选择)
//   id 3 = START (开始)
//   id 4-7 = D-pad (方向键)

export const NES_CONTROLS = {
  0: {
    // 方向键
    4: { value: 'up arrow', value2: 'DPAD_UP' },
    5: { value: 'down arrow', value2: 'DPAD_DOWN' },
    6: { value: 'left arrow', value2: 'DPAD_LEFT' },
    7: { value: 'right arrow', value2: 'DPAD_RIGHT' },
    // 选择 & 开始
    2: { value: 'shift', value2: 'SELECT' },
    3: { value: 'enter', value2: 'START' },
    // 动作键
    0: { value: 'x', value2: 'BUTTON_2' },  // B 按钮
    8: { value: 'z', value2: 'BUTTON_1' },  // A 按钮
  },
  1: {
    4: { value: 'w', value2: 'DPAD_UP' },
    5: { value: 's', value2: 'DPAD_DOWN' },
    6: { value: 'a', value2: 'DPAD_LEFT' },
    7: { value: 'd', value2: 'DPAD_RIGHT' },
    2: { value: 'right shift', value2: 'SELECT' },
    3: { value: 'right enter', value2: 'START' },
    0: { value: 'numpad 2', value2: 'BUTTON_2' },
    8: { value: 'numpad 1', value2: 'BUTTON_1' },
  },
  2: {},
  3: {},
}
