import type { ReactNode } from "react";
import { ConfigProvider, App as AntdApp } from "antd";
import { BrowserRouter } from "react-router-dom";
import { QueryProvider } from "./QueryProvider";
import { antdTheme } from "@/styles/theme";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ConfigProvider theme={antdTheme}>
      <AntdApp>
        <QueryProvider>
          <BrowserRouter basename="/hmis">{children}</BrowserRouter>
        </QueryProvider>
      </AntdApp>
    </ConfigProvider>
  );
}
