import { Row, Col, Typography } from 'antd'
import { Box, GitMerge, Route } from 'lucide-react'

import FeatureCard from '@/components/featureCard/FeatureCard.tsx'
import { COMPONENT_MAP } from '@/router/constants.tsx'

const { Title, Text } = Typography

const MDProduct: React.FC = () => {
  return (
    <div className='p-8 lg:px-12'>
      <section>
        <div className='flex items-center gap-4 mb-8'>
          <div className='w-1.5 h-8 bg-emerald-600 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.4)]' />
          <div>
            <Title
              level={3}
              className='m-0 font-black text-slate-800 tracking-tight'
            >
              {COMPONENT_MAP['md_product'].label}
            </Title>
            <Text className='text-slate-400 text-xs font-bold uppercase tracking-widest'>
              Product Intelligence
            </Text>
          </div>
        </div>
        <Row gutter={[24, 24]}>
          <Col xs={24} md={8}>
            <FeatureCard
              id='product_list'
              label={COMPONENT_MAP['product_list'].label}
              to={COMPONENT_MAP['product_list'].url}
              icon={Box}
              description='定義成品、半成品與原料屬性，包含生產前置時間與標準批量設定。'
              tag='SKU Definition'
            />
          </Col>
          <Col xs={24} md={8}>
            <FeatureCard
              id='bom_struct'
              label={COMPONENT_MAP['bom_struct'].label}
              to={COMPONENT_MAP['bom_struct'].url}
              icon={GitMerge}
              description='多階層 BOM 架構管理，支援版本控管與替代料件邏輯設定。'
              tag='Structured Data'
              tagColor='emerald'
              isNew
            />
          </Col>
          <Col xs={24} md={8}>
            <FeatureCard
              id='routing_flow'
              label={COMPONENT_MAP['routing_flow'].label}
              to={COMPONENT_MAP['routing_flow'].url}
              icon={Route}
              description='定義標準工序流（Routing），精確配置每一站點的標準工時（Standard Time）。'
              tag='Process Flow'
              tagColor='teal'
            />
          </Col>
        </Row>
      </section>
    </div>
  )
}

export default MDProduct
