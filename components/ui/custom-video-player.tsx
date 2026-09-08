"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { m, AnimatePresence } from "framer-motion"
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  SkipForward,
  SkipBack,
  Settings,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface CustomVideoPlayerProps {
  videoId: string
  title?: string
  onEnded?: () => void
  className?: string
}

declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady: (() => void) | undefined
  }
}

let apiLoaded = false
let apiReady = false
const readyCallbacks: (() => void)[] = []

function loadYouTubeAPI() {
  if (apiReady) return Promise.resolve()
  if (apiLoaded) {
    return new Promise<void>((resolve) => {
      readyCallbacks.push(resolve)
    })
  }
  apiLoaded = true
  return new Promise<void>((resolve) => {
    readyCallbacks.push(resolve)
    const tag = document.createElement("script")
    tag.src = "https://www.youtube.com/iframe_api"
    const firstScript = document.getElementsByTagName("script")[0]
    firstScript?.parentNode?.insertBefore(tag, firstScript)
    window.onYouTubeIframeAPIReady = () => {
      apiReady = true
      readyCallbacks.forEach((cb) => cb())
      readyCallbacks.length = 0
    }
  })
}

export default function CustomVideoPlayer({
  videoId,
  title,
  onEnded,
  className,
}: CustomVideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<any>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const controlsTimeoutRef = useRef<NodeJS.Timeout>(undefined)
  const animFrameRef = useRef<number>(undefined)

  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(80)
  const [currentTime, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)
  const [buffered, setBuffered] = useState(0)
  const [showControls, setShowControls] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [hasStarted, setHasStarted] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [showSettings, setShowSettings] = useState(false)
  const [showVolume, setShowVolume] = useState(false)

  const formatTime = useCallback((seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)
    if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
    return `${m}:${s.toString().padStart(2, "0")}`
  }, [])

  useEffect(() => {
    let player: any
    const initPlayer = async () => {
      await loadYouTubeAPI()
      if (!window.YT?.Player) return

      player = new window.YT.Player(`yt-player-${videoId}`, {
        videoId,
        playerVars: {
          controls: 0,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          iv_load_policy: 3,
          fs: 0,
          disablekb: 1,
          playsinline: 1,
          origin: window.location.origin,
          cc_load_policy: 0,
          autohide: 1,
          loop: 0,
          autoplay: 0,
          mute: 0,
        },
        events: {
          onReady: (e: any) => {
            playerRef.current = e.target
            setDuration(e.target.getDuration())
            setIsLoading(false)
            e.target.setVolume(volume)
          },
          onStateChange: (e: any) => {
            const state = e.data
            if (state === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true)
              setHasStarted(true)
              startProgressUpdate()
            } else if (state === window.YT.PlayerState.PAUSED) {
              setIsPlaying(false)
              stopProgressUpdate()
            } else if (state === window.YT.PlayerState.ENDED) {
              setIsPlaying(false)
              stopProgressUpdate()
              onEnded?.()
            } else if (state === window.YT.PlayerState.BUFFERING) {
              setIsLoading(true)
            }
            if (state !== window.YT.PlayerState.BUFFERING) {
              setIsLoading(false)
            }
          },
        },
      })
    }

    initPlayer()

    return () => {
      stopProgressUpdate()
      if (playerRef.current) {
        try { playerRef.current.destroy() } catch {}
      }
    }
  }, [videoId])

  const startProgressUpdate = useCallback(() => {
    const update = () => {
      if (playerRef.current?.getCurrentTime) {
        setCurrent(playerRef.current.getCurrentTime())
        const loaded = playerRef.current.getVideoLoadedFraction?.() ?? 0
        setBuffered(loaded * 100)
      }
      animFrameRef.current = requestAnimationFrame(update)
    }
    update()
  }, [])

  const stopProgressUpdate = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
  }, [])

  const togglePlay = useCallback(() => {
    if (!playerRef.current) return
    if (isPlaying) {
      playerRef.current.pauseVideo()
    } else {
      playerRef.current.playVideo()
    }
  }, [isPlaying])

  const toggleMute = useCallback(() => {
    if (!playerRef.current) return
    if (isMuted) {
      playerRef.current.unMute()
      playerRef.current.setVolume(volume)
      setIsMuted(false)
    } else {
      playerRef.current.mute()
      setIsMuted(true)
    }
  }, [isMuted, volume])

  const handleVolumeChange = useCallback((val: number) => {
    if (!playerRef.current) return
    setVolume(val)
    playerRef.current.setVolume(val)
    if (val === 0) {
      playerRef.current.mute()
      setIsMuted(true)
    } else {
      playerRef.current.unMute()
      setIsMuted(false)
    }
  }, [])

  const handleSeek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!progressRef.current || !playerRef.current) return
      const rect = progressRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const pct = Math.max(0, Math.min(1, x / rect.width))
      playerRef.current.seekTo(pct * duration, true)
      setCurrent(pct * duration)
    },
    [duration]
  )

  const skip = useCallback(
    (seconds: number) => {
      if (!playerRef.current) return
      const newTime = Math.max(0, Math.min(duration, currentTime + seconds))
      playerRef.current.seekTo(newTime, true)
      setCurrent(newTime)
    },
    [currentTime, duration]
  )

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }, [])

  const changePlaybackRate = useCallback((rate: number) => {
    if (!playerRef.current) return
    playerRef.current.setPlaybackRate(rate)
    setPlaybackRate(rate)
    setShowSettings(false)
  }, [])

  const handleMouseMove = useCallback(() => {
    setShowControls(true)
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000)
    }
  }, [isPlaying])

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener("fullscreenchange", handleFsChange)
    return () => document.removeEventListener("fullscreenchange", handleFsChange)
  }, [])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      switch (e.key) {
        case " ":
        case "k":
          e.preventDefault()
          togglePlay()
          break
        case "ArrowRight":
          e.preventDefault()
          skip(10)
          break
        case "ArrowLeft":
          e.preventDefault()
          skip(-10)
          break
        case "m":
          e.preventDefault()
          toggleMute()
          break
        case "f":
          e.preventDefault()
          toggleFullscreen()
          break
      }
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [togglePlay, skip, toggleMute, toggleFullscreen])

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div
      ref={containerRef}
      className={cn(
        "group relative w-full overflow-hidden bg-[#0a0a0a]",
        isFullscreen ? "fixed inset-0 z-[9999]" : "aspect-video",
        className
      )}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {/* YouTube iframe (hidden controls + branding) */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          id={`yt-player-${videoId}`}
          className="pointer-events-none"
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: "115%",
            height: "115%",
            transform: "translate(-50%, -50%)",
          }}
        />
      </div>

      {/* Permanent covers to hide any YouTube watermark / branding */}
      <div className="absolute bottom-0 inset-x-0 h-[60px] z-[5] pointer-events-none" style={{ background: "linear-gradient(to top, #0a0a0a 30%, transparent 100%)" }} />
      <div className="absolute top-0 inset-x-0 h-[50px] z-[5] pointer-events-none" style={{ background: "linear-gradient(to bottom, #0a0a0a 20%, transparent 100%)" }} />

      {/* Click to play/pause overlay — blocks all interactions with YouTube iframe */}
      <div
        className="absolute inset-0 z-10 cursor-pointer"
        onClick={togglePlay}
        onDoubleClick={toggleFullscreen}
      />

      {/* Loading spinner */}
      <AnimatePresence>
        {isLoading && hasStarted && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-black/20"
          >
            <Loader2 className="h-12 w-12 animate-spin text-white/80" />
          </m.div>
        )}
      </AnimatePresence>

      {/* Initial play button overlay */}
      <AnimatePresence>
        {!hasStarted && !isLoading && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-gradient-to-t from-black/80 via-black/40 to-black/30 cursor-pointer"
            onClick={togglePlay}
          >
            <m.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="flex h-20 w-20 items-center justify-center rounded-full bg-primary shadow-2xl shadow-primary/40 sm:h-24 sm:w-24"
            >
              <Play className="h-8 w-8 text-white sm:h-10 sm:w-10" fill="currentColor" />
            </m.div>
            {title && (
              <p className="max-w-md px-4 text-center text-base font-semibold text-white/90 sm:text-lg">
                {title}
              </p>
            )}
          </m.div>
        )}
      </AnimatePresence>

      {/* Controls overlay */}
      <AnimatePresence>
        {(showControls || !isPlaying) && hasStarted && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-x-0 bottom-0 z-30"
          >
            {/* Gradient background */}
            <div className="bg-gradient-to-t from-black/90 via-black/50 to-transparent px-3 pb-3 pt-16 sm:px-5 sm:pb-4">
              {/* Progress bar */}
              <div className="mb-3 flex items-center gap-3">
                <span className="min-w-[42px] text-xs font-medium text-white/80 tabular-nums">
                  {formatTime(currentTime)}
                </span>
                <div
                  ref={progressRef}
                  className="group/progress relative h-1.5 flex-1 cursor-pointer rounded-full bg-white/20 transition-all hover:h-2.5"
                  onClick={handleSeek}
                >
                  <div
                    className="absolute inset-y-0 start-0 rounded-full bg-white/20"
                    style={{ width: `${buffered}%` }}
                  />
                  <div
                    className="absolute inset-y-0 start-0 rounded-full bg-primary"
                    style={{ width: `${progressPct}%` }}
                  />
                  <div
                    className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-primary opacity-0 shadow-lg transition-opacity group-hover/progress:opacity-100"
                    style={{ left: `calc(${progressPct}% - 8px)` }}
                  />
                </div>
                <span className="min-w-[42px] text-end text-xs font-medium text-white/80 tabular-nums">
                  {formatTime(duration)}
                </span>
              </div>

              {/* Control buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 sm:gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); togglePlay() }}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-white/90 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" fill="currentColor" />}
                  </button>

                  <button
                    onClick={(e) => { e.stopPropagation(); skip(-10) }}
                    className="hidden h-9 w-9 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-white/10 hover:text-white sm:flex"
                  >
                    <SkipBack className="h-4 w-4" />
                  </button>

                  <button
                    onClick={(e) => { e.stopPropagation(); skip(10) }}
                    className="hidden h-9 w-9 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-white/10 hover:text-white sm:flex"
                  >
                    <SkipForward className="h-4 w-4" />
                  </button>

                  {/* Volume */}
                  <div
                    className="relative flex items-center"
                    onMouseEnter={() => setShowVolume(true)}
                    onMouseLeave={() => setShowVolume(false)}
                  >
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleMute() }}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      {isMuted || volume === 0 ? (
                        <VolumeX className="h-5 w-5" />
                      ) : (
                        <Volume2 className="h-5 w-5" />
                      )}
                    </button>
                    <AnimatePresence>
                      {showVolume && (
                        <m.div
                          initial={{ width: 0, opacity: 0 }}
                          animate={{ width: 80, opacity: 1 }}
                          exit={{ width: 0, opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className="hidden overflow-hidden sm:block"
                        >
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={isMuted ? 0 : volume}
                            onChange={(e) => handleVolumeChange(Number(e.target.value))}
                            onClick={(e) => e.stopPropagation()}
                            className="h-1 w-full cursor-pointer accent-primary"
                          />
                        </m.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {title && (
                    <span className="ms-2 hidden max-w-[200px] truncate text-sm font-medium text-white/70 lg:inline">
                      {title}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 sm:gap-2">
                  {/* Playback speed */}
                  <div className="relative">
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowSettings(!showSettings) }}
                      className="flex h-9 items-center justify-center gap-1 rounded-lg px-2 text-xs font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      <Settings className="h-4 w-4" />
                      <span className="hidden sm:inline">{playbackRate}x</span>
                    </button>
                    <AnimatePresence>
                      {showSettings && (
                        <m.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute bottom-full end-0 mb-2 overflow-hidden rounded-xl border border-white/10 bg-[#1a1a2e]/95 py-1 shadow-2xl backdrop-blur-xl"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                            <button
                              key={rate}
                              onClick={() => changePlaybackRate(rate)}
                              className={cn(
                                "flex w-full items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-white/10",
                                playbackRate === rate ? "text-primary font-semibold" : "text-white/80"
                              )}
                            >
                              {rate === 1 ? "عادي" : `${rate}x`}
                            </button>
                          ))}
                        </m.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <button
                    onClick={(e) => { e.stopPropagation(); toggleFullscreen() }}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>

      {/* Center play/pause feedback */}
      <AnimatePresence>
        {hasStarted && showControls && !isPlaying && (
          <m.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm">
              <Play className="h-7 w-7 text-white" fill="currentColor" />
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  )
}
