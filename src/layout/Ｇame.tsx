import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  Trophy,
  Play,
  RotateCcw,
  Info,
  Clock,
  Gamepad2,
  X,
  Target
} from 'lucide-react'
import {
  ConfigProvider,
  Card,
  Button,
  Modal,
  Typography,
  Space,
  Tag
} from 'antd'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import dayjs from 'dayjs'

const { Title, Text } = Typography

// --- 工具函式 ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// --- 遊戲常數 ---
const CANVAS_WIDTH = 800
const CANVAS_HEIGHT = 300
const GROUND_Y = 260
const INITIAL_SPEED = 6
const SPEED_INCREMENT = 0.001
const GRAVITY = 0.6
const JUMP_FORCE = -13
const MIN_JUMP_VY = -6
const DROP_FORCE = 1.2

interface ScoreEntry {
  score: number
  date: string
}

type GameState = 'START' | 'PLAYING' | 'GAME_OVER'

interface Obstacle {
  x: number
  y: number
  width: number
  height: number
  type: 'cactus' | 'bird'
  getHitbox: () => { x: number; y: number; width: number; height: number }
  draw: (ctx: CanvasRenderingContext2D, frameCount: number) => void
}

// --- 核心遊戲組件 ---
const DinoGame: React.FC<{
  onGameOver: (score: number) => void
  highScore: number
  leaderboard: ScoreEntry[]
  latestEntry: ScoreEntry | null
}> = ({ onGameOver, highScore, leaderboard, latestEntry }) => {
  const [gameState, setGameState] = useState<GameState>('START')
  const [currentScore, setCurrentScore] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const requestRef = useRef<number>(-1)

  const gameData = useRef({
    score: 0,
    speed: INITIAL_SPEED,
    frameCount: 0,
    obstacles: [] as Obstacle[],
    dino: {
      y: GROUND_Y,
      vy: 0,
      isJumping: false,
      isDucking: false,
      width: 44,
      height: 44,
      duckHeight: 26
    },
    keys: { jump: false, duck: false }
  })

  const drawDino = (ctx: CanvasRenderingContext2D) => {
    const { dino, frameCount } = gameData.current
    ctx.save()
    const currentH =
      dino.isDucking && !dino.isJumping ? dino.duckHeight : dino.height
    ctx.translate(50, dino.y - currentH)
    ctx.fillStyle = dino.isDucking ? '#1e293b' : '#334155'

    if (dino.isDucking && !dino.isJumping) {
      ctx.beginPath()

      if (ctx.roundRect) ctx.roundRect(0, 0, 56, 26, 8)
      else ctx.rect(0, 0, 56, 26)
      ctx.fill()
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(44, 6, 4, 4)
    } else {
      ctx.beginPath()

      if (ctx.roundRect) ctx.roundRect(0, 0, 44, 40, 8)
      else ctx.rect(0, 0, 44, 40)
      ctx.fill()
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(32, 8, 4, 4)
      ctx.fillStyle = '#334155'
      if (dino.isJumping) {
        ctx.fillRect(8, 40, 10, 4)
        ctx.fillRect(26, 40, 10, 4)
      } else {
        const step = Math.floor(frameCount / 6) % 2 === 0
        ctx.fillRect(step ? 8 : 12, 40, 10, 4)
        ctx.fillRect(step ? 26 : 30, 40, 10, 4)
      }
    }
    ctx.restore()
  }

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const data = gameData.current
    if (data.keys.jump && !data.dino.isJumping) {
      data.dino.vy = JUMP_FORCE
      data.dino.isJumping = true
    }
    if (!data.keys.jump && data.dino.isJumping && data.dino.vy < MIN_JUMP_VY) {
      data.dino.vy = MIN_JUMP_VY
    }
    if (data.keys.duck && data.dino.isJumping) {
      data.dino.vy += DROP_FORCE
    }

    data.dino.y += data.dino.vy
    data.dino.vy += GRAVITY
    if (data.dino.y >= GROUND_Y) {
      data.dino.y = GROUND_Y
      data.dino.vy = 0
      data.dino.isJumping = false
    }
    data.dino.isDucking = data.keys.duck && !data.dino.isJumping

    const spawnInterval = Math.max(45, Math.floor(110 / (data.speed / 6)))
    if (data.frameCount % spawnInterval === 0) {
      const isBird = Math.random() > 0.75
      if (isBird) {
        const birdY = [GROUND_Y - 25, GROUND_Y - 65, GROUND_Y - 95][
          Math.floor(Math.random() * 3)
        ]
        data.obstacles.push({
          x: CANVAS_WIDTH,
          y: birdY,
          width: 45,
          height: 30,
          type: 'bird',
          getHitbox: function () {
            return { x: this.x + 5, y: this.y + 5, width: 35, height: 20 }
          },
          draw: function (ctx: CanvasRenderingContext2D, frame: number) {
            ctx.save()
            ctx.translate(this.x, this.y)
            ctx.fillStyle = '#f43f5e'
            ctx.beginPath()
            if (ctx.roundRect) ctx.roundRect(10, 10, 25, 10, 4)
            else ctx.rect(10, 10, 25, 10)
            ctx.fill()
            ctx.beginPath()
            ctx.moveTo(35, 15)
            ctx.lineTo(45, 12)
            ctx.lineTo(35, 10)
            ctx.fill()
            const wingUp = Math.floor(frame / 10) % 2 === 0
            ctx.beginPath()
            if (wingUp) {
              ctx.moveTo(15, 10)
              ctx.lineTo(25, -5)
              ctx.lineTo(30, 10)
            } else {
              ctx.moveTo(15, 20)
              ctx.lineTo(25, 35)
              ctx.lineTo(30, 20)
            }
            ctx.fill()
            ctx.restore()
          }
        })
      } else {
        const cactusH = 35 + Math.random() * 35
        const cactusW = 24 + Math.random() * 26
        data.obstacles.push({
          x: CANVAS_WIDTH,
          y: GROUND_Y - cactusH,
          width: cactusW,
          height: cactusH,
          type: 'cactus',
          getHitbox: function () {
            return {
              x: this.x + 4,
              y: this.y + 4,
              width: this.width - 8,
              height: this.height - 8
            }
          },
          draw: function (ctx: CanvasRenderingContext2D) {
            ctx.fillStyle = '#10b981'
            ctx.beginPath()
            if (ctx.roundRect)
              ctx.roundRect(this.x, this.y, this.width, this.height, 6)
            else ctx.rect(this.x, this.y, this.width, this.height)
            ctx.fill()
          }
        })
      }
    }

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    ctx.strokeStyle = '#f1f5f9'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(0, GROUND_Y)
    ctx.lineTo(CANVAS_WIDTH, GROUND_Y)
    ctx.stroke()
    drawDino(ctx)

    const dinoHitbox = (() => {
      const h =
        data.dino.isDucking && !data.dino.isJumping
          ? data.dino.duckHeight
          : data.dino.height
      const w =
        data.dino.isDucking && !data.dino.isJumping ? 56 : data.dino.width
      return {
        x: 50 + 6,
        y: data.dino.y - h + 6,
        width: w - 12,
        height: h - 12
      }
    })()

    for (let i = data.obstacles.length - 1; i >= 0; i--) {
      const obs = data.obstacles[i]
      obs.x -= data.speed
      obs.draw(ctx, data.frameCount)
      const obsHitbox = obs.getHitbox()
      if (
        dinoHitbox.x < obsHitbox.x + obsHitbox.width &&
        dinoHitbox.x + dinoHitbox.width > obsHitbox.x &&
        dinoHitbox.y < obsHitbox.y + obsHitbox.height &&
        dinoHitbox.y + dinoHitbox.height > obsHitbox.y
      ) {
        setGameState('GAME_OVER')
        onGameOver(Math.floor(data.score))
        return
      }
      if (obs.x + 100 < 0) {
        data.obstacles.splice(i, 1)
        data.score += 10
        setCurrentScore(Math.floor(data.score))
      }
    }
    data.speed += SPEED_INCREMENT
    data.frameCount++
    requestRef.current = requestAnimationFrame(gameLoop)
  }, [onGameOver])

  useEffect(() => {
    if (gameState === 'PLAYING') {
      gameData.current = {
        score: 0,
        speed: INITIAL_SPEED,
        frameCount: 0,
        obstacles: [],
        dino: {
          y: GROUND_Y,
          vy: 0,
          isJumping: false,
          isDucking: false,
          width: 44,
          height: 44,
          duckHeight: 26
        },
        keys: { jump: false, duck: false }
      }
      setCurrentScore(0)
      requestRef.current = requestAnimationFrame(gameLoop)
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current)
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current)
    }
  }, [gameState, gameLoop])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const isDown = e.type === 'keydown'
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        gameData.current.keys.jump = isDown
        if (isDown && gameState !== 'PLAYING') setGameState('PLAYING')
        e.preventDefault()
      }
      if (e.code === 'ArrowDown') {
        gameData.current.keys.duck = isDown
        e.preventDefault()
      }
    }
    window.addEventListener('keydown', handleKey)
    window.addEventListener('keyup', handleKey)
    return () => {
      window.removeEventListener('keydown', handleKey)
      window.removeEventListener('keyup', handleKey)
    }
  }, [gameState])

  return (
    <div className='flex flex-col gap-6'>
      {/* 標題與得分 */}
      <div className='flex justify-between items-end px-2 border-b border-slate-100 pb-4'>
        <Space direction='vertical' size={0}>
          <Text
            strong
            className='text-slate-400 text-[10px] uppercase tracking-widest'
          >
            實時效能監控
          </Text>
          <Title
            level={2}
            className='m-0! font-black! tracking-tighter! text-slate-800! uppercase'
          >
            Dino Core <span className='text-blue-600'>Engine</span>
          </Title>
        </Space>
        <div className='text-right'>
          <Text
            strong
            className='text-[10px] text-slate-400 uppercase tracking-widest'
          >
            Score
          </Text>
          <p className='text-5xl font-black text-blue-600 tabular-nums leading-none tracking-tighter'>
            {currentScore.toString().padStart(5, '0')}
          </p>
        </div>
      </div>

      {/* 畫布區域 */}
      <Card className='relative border-none shadow-2xl shadow-blue-200/20 rounded-[40px] overflow-hidden bg-white aspect-8/3 w-full'>
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className='w-full h-full block'
        />
        {gameState !== 'PLAYING' && (
          <div className='absolute inset-0 bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center z-50 animate-in fade-in duration-300'>
            <Button
              type='primary'
              size='large'
              className={cn(
                'w-16! h-16! rounded-2xl flex items-center justify-center mb-4 shadow-lg transition-colors',
                gameState === 'START' ? 'bg-blue-600' : 'bg-slate-800'
              )}
              onClick={() => setGameState('PLAYING')}
            >
              {gameState === 'START' ? (
                <Play size={32} className='text-white ml-1' />
              ) : (
                <RotateCcw size={32} className='text-white' />
              )}
            </Button>
            <Title
              level={3}
              className='m-0! font-black! tracking-tighter! uppercase'
            >
              {gameState === 'START' ? 'System Ready' : 'Game Over'}
            </Title>
          </div>
        )}
      </Card>

      {/* 底部數據面板 */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4 min-h-40'>
        <Card
          size='small'
          className='rounded-2xl border-none shadow-sm bg-slate-50/80'
        >
          <div className='flex items-center gap-2 mb-2 text-blue-600 px-1'>
            <Trophy size={14} className='fill-blue-600/20' />
            <span className='font-black text-[10px] uppercase tracking-tight'>
              Top 3 Records
            </span>
          </div>
          <div className='flex flex-col gap-1.5'>
            {leaderboard.map((e, i) => (
              <div
                key={i}
                className='flex justify-between items-center p-1.5 rounded-lg bg-white border border-slate-100'
              >
                <div className='flex items-center gap-2'>
                  <span
                    className={cn(
                      'w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black',
                      i === 0
                        ? 'bg-yellow-400 text-white'
                        : 'bg-slate-200 text-slate-500'
                    )}
                  >
                    {i + 1}
                  </span>
                  <span className='text-[10px] font-bold text-slate-400'>
                    {e.date.split(' ')[0]}
                  </span>
                </div>
                <span className='font-black text-slate-700 tabular-nums text-xs'>
                  {e.score}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <div className='grid grid-rows-2 gap-4'>
          <div className='bg-slate-800 p-3 rounded-2xl flex items-center justify-between text-white shadow-sm transition-all hover:bg-slate-700'>
            <div className='flex items-center gap-2'>
              <Clock size={14} className='text-blue-400' />
              <span className='font-black text-[10px] uppercase'>
                Last Score
              </span>
            </div>
            <span className='text-lg font-black tabular-nums'>
              {latestEntry?.score || '0'}
            </span>
          </div>
          <div className='bg-white border border-slate-100 p-3 rounded-2xl flex items-center justify-between shadow-sm'>
            <div className='flex items-center gap-2'>
              <Target size={14} className='text-emerald-500' />
              <span className='font-black text-[10px] uppercase text-slate-400'>
                Best Record
              </span>
            </div>
            <span className='text-lg font-black tabular-nums text-slate-800'>
              {highScore}
            </span>
          </div>
        </div>

        <Card
          size='small'
          className='rounded-2xl border-none shadow-sm bg-blue-50/50'
        >
          <div className='flex items-center gap-2 mb-3 text-blue-600 px-1'>
            <Gamepad2 size={14} />
            <span className='font-black text-[10px] uppercase tracking-tight'>
              Control Inputs
            </span>
          </div>
          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <Tag className='m-0 border-none bg-white text-[10px] font-bold py-0.5 px-2 rounded-md shadow-sm'>
                SPACE / ↑
              </Tag>
              <Text className='text-[10px] font-medium text-slate-500'>
                Jump / Start
              </Text>
            </div>
            <div className='flex items-center justify-between'>
              <Tag className='m-0 border-none bg-white text-[10px] font-bold py-0.5 px-2 rounded-md shadow-sm'>
                ARROW ↓
              </Tag>
              <Text className='text-[10px] font-medium text-slate-500'>
                Duck / Drop
              </Text>
            </div>
          </div>
        </Card>
      </div>

      <div className='flex items-center gap-2 px-2 opacity-60'>
        <Info size={12} className='text-slate-400' />
        <Text className='text-[10px] text-slate-400 font-medium italic'>
          系統運作正常。隨時可進行核心反應能力測評。
        </Text>
      </div>
    </div>
  )
}

// --- 主介面 (彩蛋模式) ---
export default function Game() {
  const [isModalVisible, setIsModalVisible] = useState(false)

  // 運用惰性初始化狀態，直接從 localStorage 讀取值，避免在 useEffect 中 setState
  const [leaderboard, setLeaderboard] = useState<ScoreEntry[]>(() => {
    const saved = localStorage.getItem('dino_leaderboard')
    return saved ? (JSON.parse(saved) as ScoreEntry[]) : []
  })

  const [highScore, setHighScore] = useState<number>(() => {
    const saved = localStorage.getItem('dino_highscore')
    return saved ? parseInt(saved, 10) : 0
  })

  const [latestEntry, setLatestEntry] = useState<ScoreEntry | null>(() => {
    const saved = localStorage.getItem('dino_latest_score')
    return saved ? (JSON.parse(saved) as ScoreEntry) : null
  })

  const handleGameOver = useCallback(
    (finalScore: number) => {
      const newEntry: ScoreEntry = {
        score: finalScore,
        date: dayjs().format('YYYY/MM/DD HH:mm')
      }

      setLatestEntry(newEntry)
      localStorage.setItem('dino_latest_score', JSON.stringify(newEntry))

      setLeaderboard(prev => {
        const updated = [...prev, newEntry]
          .sort((a, b) => b.score - a.score)
          .slice(0, 3)
        localStorage.setItem('dino_leaderboard', JSON.stringify(updated))
        return updated
      })

      if (finalScore > highScore) {
        setHighScore(finalScore)
        localStorage.setItem('dino_highscore', finalScore.toString())
      }
    },
    [highScore]
  )

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#3b82f6',
          borderRadius: 8,
          fontFamily: 'Inter, "Noto Sans TC", sans-serif'
        }
      }}
    >
      <div className='flex items-center justify-center p-6 bg-slate-50/50 min-h-15'>
        {/* 只有一個低調的 Copyright 按鈕 */}
        <Button
          type='text'
          size='small'
          className='text-slate-400 hover:text-blue-500 font-medium tracking-tight text-xs transition-all flex items-center'
          onClick={() => setIsModalVisible(true)}
        >
          Copyright © 2026
        </Button>

        {/* 遊戲視窗 Modal */}
        <Modal
          open={isModalVisible}
          onCancel={() => setIsModalVisible(false)}
          footer={null}
          width={880}
          centered
          destroyOnHidden
          styles={{
            root: { padding: '40px 32px 32px', borderRadius: 32 },
            body: { paddingTop: 0 }
          }}
          closeIcon={
            <div className='bg-slate-100 p-2 rounded-xl text-slate-400 hover:text-slate-600 transition-colors'>
              <X size={16} />
            </div>
          }
        >
          <DinoGame
            onGameOver={handleGameOver}
            highScore={highScore}
            leaderboard={leaderboard}
            latestEntry={latestEntry}
          />
        </Modal>

        <style>{`
          .tabular-nums { font-variant-numeric: tabular-nums; }
          .ant-modal-mask { backdrop-filter: blur(12px); background: rgba(15, 23, 42, 0.4) !important; }
        `}</style>
      </div>
    </ConfigProvider>
  )
}
