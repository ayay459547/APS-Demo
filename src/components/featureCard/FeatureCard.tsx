import React from 'react'
import { Card, Button, Tag, Badge, Typography } from 'antd'
import { ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

import type { FeatureCardProps } from './types'

const { Title, Paragraph, Text } = Typography

/**
 * 樣式合併工具函數
 */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  label,
  icon: Icon,
  to = '/',
  description,
  tag,
  tagColor = 'blue',
  isNew
}) => {
  const navigate = useNavigate()

  return (
    <Card
      hoverable
      className='cursor-default! h-full border-none shadow-sm hover:shadow-xl transition-all duration-500 rounded-3xl group relative overflow-hidden bg-white'
      styles={{ body: { padding: '28px' } }}
    >
      <div className='absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity'>
        <Icon size={80} />
      </div>

      <div className='relative z-10'>
        <div className='flex justify-between items-start mb-6'>
          <div
            className={cn(
              'w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-lg',
              'bg-slate-50 text-slate-600 group-hover:bg-indigo-600 group-hover:text-white group-hover:shadow-indigo-200'
            )}
          >
            <Icon size={24} />
          </div>
          {isNew && (
            <Badge
              status='error'
              text={
                <Text className='text-[10px] font-black text-rose-500 uppercase tracking-widest'>
                  New
                </Text>
              }
            />
          )}
        </div>

        <Title
          level={5}
          className='m-0 mb-2 font-black text-slate-800 tracking-tight flex items-center gap-2'
        >
          {label}
          {tag && (
            <Tag
              color={tagColor}
              className='border-none rounded-md text-[9px] font-bold uppercase px-1.5'
            >
              {tag}
            </Tag>
          )}
        </Title>

        <Paragraph className='text-slate-400 text-xs leading-relaxed mb-6 h-10 overflow-hidden'>
          {description}
        </Paragraph>

        <Button
          variant='text'
          color='primary'
          className='p-0 flex items-center gap-2 font-bold text-xs group-hover:gap-3 transition-all'
          onClick={() => navigate(`/${to}`)}
        >
          進入功能 <ArrowRight size={14} />
        </Button>
      </div>
    </Card>
  )
}

export default FeatureCard
