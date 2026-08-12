import { App } from 'antd';

/** Access antd's message/notification/modal statics from within the ConfigProvider/App context. */
export function useFeedback() {
  return App.useApp();
}
