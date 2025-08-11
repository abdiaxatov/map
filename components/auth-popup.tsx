"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Chrome, Github } from "lucide-react"

interface AuthPopupProps {
  mode: "signin" | "create"
  onSignInGoogle: () => void
  onSignInGithub: () => void
  onCreateMap: () => void
}

export function AuthPopup({ mode, onSignInGoogle, onSignInGithub, onCreateMap }: AuthPopupProps) {
  return (
    <Card className="fixed left-1/2 top-1/2 z-[100] w-[90%] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-md bg-white p-0 text-center shadow-lg">
      <CardHeader className="p-0">
        <CardTitle className="header-text mt-[35px] text-base font-bold text-black">
          {mode === "signin" ? "Mapus'ga xush kelibsiz!" : "Ro'yxatdan o'ting"}
        </CardTitle>
        <CardDescription className="subheader-text mt-[15px] text-sm font-medium text-gray-600">
          {mode === "signin"
            ? "Boshlash uchun Google yoki GitHub orqali tizimga kiring."
            : "Xarita yaratish yoki yopiq guruhlarga kirish uchun ro'yxatdan o'ting."}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Button
          id="google-signin"
          className="mx-auto mt-[25px] flex h-[45px] w-[90%] items-center justify-center rounded-md border border-gray-200 bg-white text-sm font-bold text-gray-600 shadow-[0px_1px_2px_rgba(53,87,98,0.1)] hover:bg-gray-50"
          onClick={onSignInGoogle}
        >
          <Chrome className="mr-2 h-5 w-5" /> Google orqali {mode === "signin" ? "kirish" : "ro'yxatdan o'tish"}
        </Button>
        <Button
          id="github-signin"
          className="mx-auto mt-[10px] mb-[35px] flex h-[45px] w-[90%] items-center justify-center rounded-md border border-gray-200 bg-white text-sm font-bold text-gray-600 shadow-[0px_1px_2px_rgba(53,87,98,0.1)] hover:bg-gray-50"
          onClick={onSignInGithub}
        >
          <Github className="mr-2 h-5 w-5" /> GitHub orqali {mode === "signin" ? "kirish" : "ro'yxatdan o'tish"}
        </Button>
        {mode === "create" && (
          <Button
            id="create-map"
            className="mx-auto mt-[10px] mb-[35px] flex h-[45px] w-[90%] items-center justify-center rounded-md border border-gray-200 bg-black text-sm font-bold text-white hover:opacity-80"
            onClick={onCreateMap}
          >
            Mehmon sifatida davom etish
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
