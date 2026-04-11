import { Typography, Row, Col } from 'antd'
import { Zap, CalendarDays, ClipboardList } from 'lucide-react'

import { COMPONENT_MAP } from '@/router/constants.tsx'
import FeatureCard from '@/components/featureCard/FeatureCard.tsx'

const { Title, Text } = Typography

const OrderManage: React.FC = () => {
  return (
    <div className='p-8 lg:px-12'>
      <section>
        <div className='flex items-center gap-4 mb-8'>
          <div className='w-1.5 h-8 bg-blue-600 rounded-full' />
          <div>
            <Title
              level={3}
              className='m-0 font-black text-slate-800 tracking-tight'
            >
              {COMPONENT_MAP['order_manage'].label}
            </Title>
            <Text className='text-slate-400 text-xs font-bold uppercase tracking-widest'>
              Order Orchestration
            </Text>
          </div>
        </div>
        <Row gutter={[24, 24]}>
          <Col xs={24} md={8}>
            <FeatureCard
              id='o_list'
              label={COMPONENT_MAP['o_list'].label}
              to={COMPONENT_MAP['o_list'].url}
              icon={ClipboardList}
              description='全方位訂單匯總，支援多維度篩選與自動化優先級評分。'
              tag='Global View'
            />
          </Col>
          <Col xs={24} md={8}>
            <FeatureCard
              id='o_rush'
              label={COMPONENT_MAP['o_rush'].label}
              to={COMPONENT_MAP['o_rush'].url}
              icon={Zap}
              description='智慧分析急單衝擊，模擬排程變動對現有工單交期的影響。'
              tag='AI Analysis'
              tagColor='orange'
            />
          </Col>
          <Col xs={24} md={8}>
            <FeatureCard
              id='o_visual_rush'
              label={COMPONENT_MAP['o_visual_rush'].label}
              to={COMPONENT_MAP['o_visual_rush'].url}
              icon={CalendarDays}
              description='日曆介面，直觀調整訂單順位與交期預估。'
              tag='Interactive'
              tagColor='purple'
              isNew
            />
          </Col>
        </Row>
      </section>
    </div>
  )
}

export default OrderManage
