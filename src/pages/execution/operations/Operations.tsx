import { Row, Col, Typography } from 'antd'
import { ClipboardPen, Repeat, ShieldCheck } from 'lucide-react'

import FeatureCard from '@/components/featureCard/FeatureCard.tsx'
import { COMPONENT_MAP } from '@/router/constants.tsx'

const { Title, Text } = Typography

const Operations: React.FC = () => {
  return (
    <div className='p-8 lg:px-12'>
      <section>
        <div className='flex items-center gap-4 mb-8'>
          <div className='w-1.5 h-6 bg-slate-800 rounded-full' />
          <div>
            <Title
              level={4}
              className='m-0 font-black text-slate-800 tracking-tight'
            >
              {COMPONENT_MAP['operations'].label}
            </Title>
            <Text className='text-slate-300 text-[9px] font-black uppercase tracking-[0.4em]'>
              Operations Input
            </Text>
          </div>
        </div>
        <Row gutter={[20, 20]}>
          <Col xs={24} md={8}>
            <FeatureCard
              id='reporting'
              label={COMPONENT_MAP['reporting'].label}
              to={COMPONENT_MAP['reporting'].url}
              icon={ClipboardPen}
              description='即時上報完工數量、良品與廢品資訊，確保系統掌握最新產出。'
              tag='Data Entry'
              tagColor='slate'
            />
          </Col>
          <Col xs={24} md={8}>
            <FeatureCard
              id='changeover'
              label={COMPONENT_MAP['changeover'].label}
              to={COMPONENT_MAP['changeover'].url}
              icon={Repeat}
              description='標準化換線流程引導，統計換模損耗工時，優化排程參數。'
              tag='Setup'
              tagColor='slate'
            />
          </Col>
          <Col xs={24} md={8}>
            <FeatureCard
              id='quality_check'
              label={COMPONENT_MAP['quality_check'].label}
              to={COMPONENT_MAP['quality_check'].url}
              icon={ShieldCheck}
              description='閉環品質抽檢機制，品質異常時自動觸發停機與重排建議。'
              tag='Quality'
              tagColor='emerald'
              isNew
            />
          </Col>
        </Row>
      </section>
    </div>
  )
}

export default Operations
