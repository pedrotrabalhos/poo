import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import * as Icon from "@/icons"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      containerAriaLabel="Notificações"
      icons={{
        success: (
          <Icon.Success className="size-4" />
        ),
        info: (
          <Icon.Info className="size-4" />
        ),
        warning: (
          <Icon.Warning className="size-4" />
        ),
        error: (
          <Icon.Error className="size-4" />
        ),
        loading: (
          <Icon.Loading className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
