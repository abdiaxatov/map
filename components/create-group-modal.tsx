"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Users, Lock, Globe } from "lucide-react"
import type { User } from "firebase/auth"

interface CreateGroupModalProps {
  currentUser: User | null
  onCreateGroup: (groupData: {
    name: string
    description: string
    type: "public" | "private"
  }) => Promise<void>
  onClose: () => void
}

export function CreateGroupModal({ currentUser, onCreateGroup, onClose }: CreateGroupModalProps) {
  const [groupName, setGroupName] = useState("")
  const [groupDescription, setGroupDescription] = useState("")
  const [groupType, setGroupType] = useState<"public" | "private">("public")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    console.log("Form submitted with:", { groupName, groupDescription, groupType })

    if (!groupName.trim()) {
      alert("Guruh nomini kiriting!")
      return
    }

    if (!currentUser) {
      alert("Tizimga kiring!")
      return
    }

    setLoading(true)

    try {
      console.log("Creating group...")
      await onCreateGroup({
        name: groupName.trim(),
        description: groupDescription.trim(),
        type: groupType,
      })
      console.log("Group created successfully")
    } catch (error) {
      console.error("Error creating group:", error)
      alert(`Guruh yaratishda xatolik: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Yangi guruh yaratish
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose} type="button">
              ✕
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="groupName">Guruh nomi *</Label>
              <Input
                id="groupName"
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Guruh nomini kiriting"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="groupDescription">Tavsif</Label>
              <Textarea
                id="groupDescription"
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                placeholder="Guruh haqida qisqacha ma'lumot"
                rows={3}
                disabled={loading}
              />
            </div>

            <div className="space-y-3">
              <Label>Guruh turi</Label>
              <RadioGroup
                value={groupType}
                onValueChange={(value) => setGroupType(value as "public" | "private")}
                disabled={loading}
              >
                <div className="flex items-center space-x-2 p-3 border rounded-lg">
                  <RadioGroupItem value="public" id="public" />
                  <Label htmlFor="public" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Globe className="h-4 w-4 text-green-600" />
                    <div>
                      <div className="font-medium">Ochiq guruh</div>
                      <div className="text-sm text-gray-500">Har kim avtomatik qo'shilishi mumkin</div>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded-lg">
                  <RadioGroupItem value="private" id="private" />
                  <Label htmlFor="private" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Lock className="h-4 w-4 text-red-600" />
                    <div>
                      <div className="font-medium">Yopiq guruh</div>
                      <div className="text-sm text-gray-500">Admin ruxsati bilan kirish</div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 bg-transparent"
                disabled={loading}
              >
                Bekor qilish
              </Button>
              <Button type="submit" disabled={loading || !groupName.trim()} className="flex-1">
                {loading ? "Yaratilmoqda..." : "Guruh yaratish"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
