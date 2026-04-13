import { Row, Col, Typography } from 'antd'
import { Zap, GitCompare } from 'lucide-react'

import FeatureCard from '@/components/featureCard/FeatureCard.tsx'
import { COMPONENT_MAP } from '@/router/constants.tsx'

const { Title, Text } = Typography

const Simulation: React.FC = () => {
  return (
    <div className='p-8 lg:px-12'>
      <section>
        <div className='flex items-center gap-4 mb-8'>
          <div className='w-1.5 h-8 bg-slate-900 rounded-full' />
          <div>
            <Title
              level={3}
              className='m-0 font-black text-slate-800 tracking-tight'
            >
              {COMPONENT_MAP['simulation'].label}
            </Title>
            <Text className='text-slate-400 text-xs font-bold uppercase tracking-widest'>
              Simulation & Optimization
            </Text>
          </div>
        </div>
        <Row gutter={[24, 24]}>
          <Col xs={24} md={12}>
            <FeatureCard
              id='whatif'
              label={COMPONENT_MAP['whatif'].label}
              to={COMPONENT_MAP['whatif'].url}
              icon={Zap}
              description='模擬設備突發故障、訂單取消或產能變動下的系統恢復力測試。'
              tag='Resilience Test'
              tagColor='gold'
            />
          </Col>
          <Col xs={24} md={12}>
            <FeatureCard
              id='compare'
              label={COMPONENT_MAP['compare'].label}
              to={COMPONENT_MAP['compare'].url}
              icon={GitCompare}
              description='多個排程版本並列分析，量化成本、交期與稼動率的最佳平衡。'
              tag='Scenario Comparison'
              tagColor='orange'
            />
          </Col>
        </Row>
      </section>
    </div>
  )
}

export default Simulation
