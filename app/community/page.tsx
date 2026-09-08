"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import Image from "next/image"
import { m, AnimatePresence } from "framer-motion"
import {
  Heart,
  MessageCircle,
  Send,
  ImageIcon,
  MoreHorizontal,
  Trash2,
  Users,
  TrendingUp,
  Award,
  Loader2,
  X,
  Clock,
  ThumbsUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar/navbar"
import { useI18n } from "@/lib/i18n"
import { useStore } from "@/lib/store"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"

interface Author {
  id: string
  name: string
  avatar?: string
  role?: string
}

interface Comment {
  id: string
  content: string
  author: Author
  createdAt: string
}

interface Post {
  id: string
  content: string
  image?: string | null
  author: Author
  isLiked: boolean
  likesCount: number
  commentsCount: number
  comments?: Comment[]
  createdAt: string
}

function timeAgo(dateStr: string, isAr = false): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return isAr ? "الآن" : "Just now"
  if (mins < 60) return isAr ? `منذ ${mins} د` : `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return isAr ? `منذ ${hrs} س` : `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return isAr ? `منذ ${days} ي` : `${days}d ago`
  return new Date(dateStr).toLocaleDateString(isAr ? "ar-EG" : "en-US")
}

function getAvatarUrl(avatar?: string): string {
  if (!avatar) return ""
  if (avatar.startsWith("http")) return avatar
  if (avatar.startsWith("/")) return `${API_BASE.replace(/\/api$/, "")}${avatar}`
  return avatar
}

export default function CommunityPage() {
  const { locale } = useI18n()
  const { isLoggedIn, user, showToast } = useStore()
  const isAr = locale === "ar"

  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  const [newPostContent, setNewPostContent] = useState("")
  const [newPostImage, setNewPostImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [posting, setPosting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({})
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({})
  const [postComments, setPostComments] = useState<Record<string, Comment[]>>({})
  const [loadingComments, setLoadingComments] = useState<Record<string, boolean>>({})
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  const getHeaders = useCallback(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
    const headers: Record<string, string> = {}
    if (token) headers["Authorization"] = `Bearer ${token}`
    return headers
  }, [])

  const fetchPosts = useCallback(async (pageNum: number, append = false) => {
    if (!append) setLoading(true)
    else setLoadingMore(true)
    try {
      const res = await fetch(`${API_BASE}/community/posts?page=${pageNum}&limit=15`, {
        headers: getHeaders(),
      })
      const json = await res.json()
      if (json.success) {
        const newPosts = json.data || []
        if (append) {
          setPosts((prev) => [...prev, ...newPosts])
        } else {
          setPosts(newPosts)
        }
        setHasMore(pageNum < (json.pagination?.pages || 1))
      }
    } catch {
      showToast(isAr ? "خطأ في تحميل المنشورات" : "Failed to load posts", "error")
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [getHeaders, isAr, showToast])

  useEffect(() => {
    fetchPosts(1)
  }, [fetchPosts])

  const handleLoadMore = () => {
    const next = page + 1
    setPage(next)
    fetchPosts(next, true)
  }

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return
    setPosting(true)
    try {
      const formData = new FormData()
      formData.append("content", newPostContent.trim())
      if (newPostImage) formData.append("file", newPostImage)

      const res = await fetch(`${API_BASE}/community/posts`, {
        method: "POST",
        headers: getHeaders(),
        body: formData,
      })
      const json = await res.json()
      if (json.success) {
        setPosts((prev) => [json.data, ...prev])
        setNewPostContent("")
        setNewPostImage(null)
        setImagePreview(null)
        showToast(isAr ? "تم نشر المنشور" : "Post published!")
      } else {
        showToast(json.message || "Error", "error")
      }
    } catch {
      showToast(isAr ? "خطأ" : "Error posting", "error")
    } finally {
      setPosting(false)
    }
  }

  const handleToggleLike = async (postId: string) => {
    if (!isLoggedIn) {
      showToast(isAr ? "يجب تسجيل الدخول أولاً" : "Please login first", "error")
      return
    }
    try {
      const res = await fetch(`${API_BASE}/community/posts/${postId}/like`, {
        method: "POST",
        headers: { ...getHeaders(), "Content-Type": "application/json" },
      })
      const json = await res.json()
      if (json.success) {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? { ...p, isLiked: json.data.liked, likesCount: json.data.likesCount }
              : p
          )
        )
      }
    } catch {
      // ignore
    }
  }

  const toggleComments = async (postId: string) => {
    const isOpen = expandedComments[postId]
    setExpandedComments((prev) => ({ ...prev, [postId]: !isOpen }))

    if (!isOpen && !postComments[postId]) {
      setLoadingComments((prev) => ({ ...prev, [postId]: true }))
      try {
        const res = await fetch(`${API_BASE}/community/posts/${postId}/comments`, {
          headers: getHeaders(),
        })
        const json = await res.json()
        if (json.success) {
          setPostComments((prev) => ({ ...prev, [postId]: json.data || [] }))
        }
      } catch {
        // ignore
      } finally {
        setLoadingComments((prev) => ({ ...prev, [postId]: false }))
      }
    }
  }

  const handleAddComment = async (postId: string) => {
    const text = commentTexts[postId]?.trim()
    if (!text) return
    if (!isLoggedIn) {
      showToast(isAr ? "يجب تسجيل الدخول أولاً" : "Please login first", "error")
      return
    }
    try {
      const res = await fetch(`${API_BASE}/community/posts/${postId}/comments`, {
        method: "POST",
        headers: { ...getHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      })
      const json = await res.json()
      if (json.success) {
        setPostComments((prev) => ({
          ...prev,
          [postId]: [json.data, ...(prev[postId] || [])],
        }))
        setPosts((prev) =>
          prev.map((p) => (p.id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p))
        )
        setCommentTexts((prev) => ({ ...prev, [postId]: "" }))
      }
    } catch {
      showToast(isAr ? "خطأ" : "Error adding comment", "error")
    }
  }

  const handleDeletePost = async (postId: string) => {
    try {
      const res = await fetch(`${API_BASE}/community/posts/${postId}`, {
        method: "DELETE",
        headers: getHeaders(),
      })
      const json = await res.json()
      if (json.success) {
        setPosts((prev) => prev.filter((p) => p.id !== postId))
        showToast(isAr ? "تم حذف المنشور" : "Post deleted")
      }
    } catch {
      showToast(isAr ? "خطأ" : "Error", "error")
    }
    setOpenMenu(null)
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setNewPostImage(file)
      const reader = new FileReader()
      reader.onload = (ev) => setImagePreview(ev.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-2xl">
          {/* Header */}
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center gap-2 bg-red-50 text-medex-red px-4 py-2 rounded-full text-sm font-semibold mb-4">
              <Users className="w-4 h-4" />
              {isAr ? "مجتمع PDS" : "PDS Community"}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {isAr ? "مجتمع المحتوى والتعلم" : "Content & learning community"}
            </h1>
            <p className="text-gray-500 max-w-md mx-auto">
              {isAr
                ? "شارك أفكارك وتعلم من الآخرين — امتداد لروح تيليغرام وواتساب على المنصة"
                : "Share ideas and learn from others—an extension of our Telegram and WhatsApp community, here on the platform"}
            </p>
          </m.div>

          {/* Stats Bar */}
          <m.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-3 gap-3 mb-6"
          >
            {[
              { icon: Users, label: isAr ? "الأعضاء" : "Members", value: "500+", color: "text-medex-red bg-red-50" },
              { icon: TrendingUp, label: isAr ? "المنشورات" : "Posts", value: `${posts.length}+`, color: "text-blue-600 bg-blue-50" },
              { icon: Award, label: isAr ? "الخبراء" : "Experts", value: "50+", color: "text-emerald-600 bg-emerald-50" },
            ].map((stat, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 text-center">
                <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${stat.color} mb-2`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div className="text-lg font-bold text-gray-900">{stat.value}</div>
                <div className="text-xs text-gray-400">{stat.label}</div>
              </div>
            ))}
          </m.div>

          {/* Create Post */}
          {isLoggedIn && user ? (
            <m.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-6 overflow-hidden"
            >
              <div className="p-4">
                <div className="flex gap-3">
                  <div className="relative w-10 h-10 shrink-0 rounded-full overflow-hidden bg-gray-200">
                    {user.avatar ? (
                      <Image src={user.avatar} alt={user.name || ""} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-medex-red text-white font-bold text-sm">
                        {(user.name || "U").charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <textarea
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    placeholder={isAr ? "شارك شيئاً مع المجتمع..." : "Share something with the community..."}
                    className="flex-1 resize-none border-0 bg-gray-50 rounded-xl p-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-medex-red/20 min-h-[80px] transition-all"
                  />
                </div>
                {imagePreview && (
                  <div className="mt-3 relative inline-block">
                    <img src={imagePreview} alt="Preview" className="max-h-48 rounded-xl object-cover" />
                    <button
                      onClick={() => { setNewPostImage(null); setImagePreview(null) }}
                      className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-50 bg-gray-50/50">
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageSelect}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-500 hover:bg-gray-100 transition-colors"
                  >
                    <ImageIcon className="w-4 h-4 text-emerald-500" />
                    {isAr ? "صورة" : "Photo"}
                  </button>
                </div>
                <Button
                  onClick={handleCreatePost}
                  disabled={posting || !newPostContent.trim()}
                  size="sm"
                  className="rounded-xl bg-medex-red hover:bg-medex-red-dark text-white px-6 gap-1.5 shadow-sm"
                >
                  {posting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      {isAr ? "نشر" : "Post"}
                    </>
                  )}
                </Button>
              </div>
            </m.div>
          ) : (
            <m.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-6 p-5 text-center"
            >
              <p className="text-gray-500 text-sm mb-3">
                {isAr ? "سجل دخولك لتشارك في المجتمع" : "Login to share and interact with the community"}
              </p>
              <a href="/login">
                <Button size="sm" className="rounded-xl bg-medex-red hover:bg-medex-red-dark text-white px-6">
                  {isAr ? "تسجيل الدخول" : "Login to Post"}
                </Button>
              </a>
            </m.div>
          )}

          {/* Posts Feed */}
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gray-200" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-3.5 bg-gray-200 rounded-full w-32" />
                      <div className="h-2.5 bg-gray-200 rounded-full w-20" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded-full w-full" />
                    <div className="h-3 bg-gray-200 rounded-full w-4/5" />
                    <div className="h-3 bg-gray-200 rounded-full w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
              <Users className="w-16 h-16 text-gray-200 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-800 mb-1">
                {isAr ? "لا توجد منشورات بعد" : "No posts yet"}
              </h3>
              <p className="text-sm text-gray-400">
                {isAr ? "كن أول من يشارك في المجتمع!" : "Be the first to share in the community!"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {posts.map((post, idx) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    index={idx}
                    isAr={isAr}
                    isLoggedIn={isLoggedIn}
                    currentUserId={user?.id}
                    currentUserRole={user?.role}
                    onToggleLike={handleToggleLike}
                    onToggleComments={toggleComments}
                    onAddComment={handleAddComment}
                    onDeletePost={handleDeletePost}
                    commentText={commentTexts[post.id] || ""}
                    setCommentText={(val: string) =>
                      setCommentTexts((prev) => ({ ...prev, [post.id]: val }))
                    }
                    isCommentsOpen={expandedComments[post.id] || false}
                    comments={postComments[post.id] || []}
                    loadingComments={loadingComments[post.id] || false}
                    openMenu={openMenu}
                    setOpenMenu={setOpenMenu}
                    currentUserAvatar={user?.avatar}
                    currentUserName={user?.name}
                  />
                ))}
              </AnimatePresence>

              {hasMore && (
                <div className="text-center pt-4">
                  <Button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    variant="outline"
                    className="rounded-xl border-gray-200 text-gray-500 hover:text-medex-red hover:border-medex-red/30 px-8"
                  >
                    {loadingMore ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isAr ? (
                      "تحميل المزيد"
                    ) : (
                      "Load More"
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function PostCard({
  post,
  index,
  isAr,
  isLoggedIn,
  currentUserId,
  currentUserRole,
  onToggleLike,
  onToggleComments,
  onAddComment,
  onDeletePost,
  commentText,
  setCommentText,
  isCommentsOpen,
  comments,
  loadingComments,
  openMenu,
  setOpenMenu,
  currentUserAvatar,
  currentUserName,
}: {
  post: Post
  index: number
  isAr: boolean
  isLoggedIn: boolean
  currentUserId?: string
  currentUserRole?: string
  onToggleLike: (id: string) => void
  onToggleComments: (id: string) => void
  onAddComment: (id: string) => void
  onDeletePost: (id: string) => void
  commentText: string
  setCommentText: (val: string) => void
  isCommentsOpen: boolean
  comments: Comment[]
  loadingComments: boolean
  openMenu: string | null
  setOpenMenu: (id: string | null) => void
  currentUserAvatar?: string
  currentUserName?: string
}) {
  const canDelete =
    currentUserId === post.author.id || currentUserRole === "ADMIN"
  const avatarUrl = getAvatarUrl(post.author.avatar)
  const imageUrl = post.image
    ? post.image.startsWith("http")
      ? post.image
      : `${API_BASE.replace(/\/api$/, "")}${post.image}`
    : null

  const roleLabel = post.author.role === "ADMIN"
    ? (isAr ? "مسؤول" : "Admin")
    : post.author.role === "TEACHER"
      ? (isAr ? "مدرب" : "Instructor")
      : post.author.role === "INSTRUCTOR"
        ? (isAr ? "مدرب" : "Instructor")
        : (isAr ? "عضو" : "Member")

  const roleBadgeColor = post.author.role === "ADMIN"
    ? "bg-red-50 text-medex-red"
    : post.author.role === "TEACHER" || post.author.role === "INSTRUCTOR"
      ? "bg-blue-50 text-blue-600"
      : "bg-gray-50 text-gray-400"

  return (
    <m.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
    >
      {/* Post Header */}
      <div className="flex items-center gap-3 p-4 pb-0">
        <div className="relative w-11 h-11 shrink-0 rounded-full overflow-hidden bg-gray-200 ring-2 ring-gray-100">
          {avatarUrl ? (
            <Image src={avatarUrl} alt={post.author.name} fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-medex-red to-red-400 text-white font-bold text-sm">
              {post.author.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-900 truncate">{post.author.name}</span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${roleBadgeColor}`}>
              {roleLabel}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Clock className="w-3 h-3" />
            {timeAgo(post.createdAt, isAr)}
          </div>
        </div>
        {isLoggedIn && canDelete && (
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === post.id ? null : post.id) }}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
            {openMenu === post.id && (
              <div className="absolute end-0 top-full mt-1 bg-white rounded-xl border border-gray-200 shadow-lg z-10 min-w-[140px] overflow-hidden">
                <button
                  onClick={() => onDeletePost(post.id)}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  {isAr ? "حذف" : "Delete"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Post Content */}
      <div className="px-4 py-3">
        <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{post.content}</p>
      </div>

      {/* Post Image */}
      {imageUrl && (
        <div className="px-4 pb-3">
          <div className="rounded-xl overflow-hidden border border-gray-100">
            <img
              src={imageUrl}
              alt="Post"
              className="w-full max-h-[400px] object-cover"
            />
          </div>
        </div>
      )}

      {/* Like / Comment Counts */}
      <div className="flex items-center justify-between px-4 py-2 text-xs text-gray-400 border-t border-gray-50">
        <span className="flex items-center gap-1">
          {post.likesCount > 0 && (
            <>
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-medex-red text-white">
                <ThumbsUp className="w-3 h-3" />
              </span>
              {post.likesCount}
            </>
          )}
        </span>
        {post.commentsCount > 0 && (
          <button onClick={() => onToggleComments(post.id)} className="hover:underline">
            {post.commentsCount} {isAr ? "تعليق" : post.commentsCount === 1 ? "comment" : "comments"}
          </button>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center border-t border-gray-100 divide-x divide-gray-100">
        <button
          onClick={() => onToggleLike(post.id)}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${
            post.isLiked
              ? "text-medex-red bg-red-50/50"
              : "text-gray-500 hover:bg-gray-50"
          }`}
        >
          <Heart className={`w-[18px] h-[18px] transition-all ${post.isLiked ? "fill-medex-red text-medex-red scale-110" : ""}`} />
          {isAr ? "إعجاب" : "Like"}
        </button>
        <button
          onClick={() => onToggleComments(post.id)}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
        >
          <MessageCircle className="w-[18px] h-[18px]" />
          {isAr ? "تعليق" : "Comment"}
        </button>
      </div>

      {/* Comments Section */}
      <AnimatePresence>
        {isCommentsOpen && (
          <m.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-gray-100 bg-gray-50/50">
              {/* Add Comment */}
              {isLoggedIn ? (
                <div className="flex items-start gap-2.5 p-3">
                  <div className="relative w-8 h-8 shrink-0 rounded-full overflow-hidden bg-gray-200">
                    {currentUserAvatar ? (
                      <Image src={currentUserAvatar} alt="" fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-medex-red text-white text-xs font-bold">
                        {(currentUserName || "U").charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 flex items-center gap-2 bg-white rounded-xl border border-gray-200 px-3 py-2">
                    <input
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault()
                          onAddComment(post.id)
                        }
                      }}
                      placeholder={isAr ? "اكتب تعليقاً..." : "Write a comment..."}
                      className="flex-1 bg-transparent text-sm text-gray-800 placeholder:text-gray-400 outline-none"
                    />
                    <button
                      onClick={() => onAddComment(post.id)}
                      disabled={!commentText.trim()}
                      className="text-medex-red hover:text-medex-red-dark disabled:text-gray-300 transition-colors"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="px-4 py-3 text-center">
                  <a href="/login" className="text-sm text-medex-red hover:underline font-medium">
                    {isAr ? "سجل دخولك للتعليق" : "Login to comment"}
                  </a>
                </div>
              )}

              {/* Comments List */}
              {loadingComments ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
                </div>
              ) : (
                <div className="px-3 pb-3 space-y-2">
                  {comments.map((c) => {
                    const cAvatar = getAvatarUrl(c.author.avatar)
                    return (
                      <div key={c.id} className="flex items-start gap-2">
                        <div className="relative w-7 h-7 shrink-0 rounded-full overflow-hidden bg-gray-200">
                          {cAvatar ? (
                            <Image src={cAvatar} alt="" fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-300 text-white text-[10px] font-bold">
                              {c.author.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="bg-white rounded-xl px-3 py-2 border border-gray-100 flex-1">
                          <span className="text-xs font-bold text-gray-800">{c.author.name}</span>
                          <p className="text-xs text-gray-600 mt-0.5">{c.content}</p>
                          <span className="text-[10px] text-gray-300 mt-1 block">{timeAgo(c.createdAt, isAr)}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </m.div>
  )
}
