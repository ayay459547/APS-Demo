import { Row, Col, Typography } from 'antd'
import { FileSearch, CopyCheck } from 'lucide-react'

import FeatureCard from '@/components/featureCard/FeatureCard.tsx'
import { COMPONENT_MAP } from '@/router/constants.tsx'

const { Title, Text } = Typography

const SchedulingRes: React.FC = () => {
  return (
    <div className='p-8 lg:px-12'>
      <section>
        <div className='flex items-center gap-4 mb-8'>
          <div className='w-1.5 h-8 bg-emerald-500 rounded-full' />
          <div>
            <Title
              level={3}
              className='m-0 font-black text-slate-800 tracking-tight'
            >
              {COMPONENT_MAP['sch_res'].label}
            </Title>
            <Text className='text-slate-400 text-xs font-bold uppercase tracking-widest'>
              Analysis & Decision
            </Text>
          </div>
        </div>
        <Row gutter={[24, 24]}>
          <Col xs={24} md={12}>
            <FeatureCard
              id='res_analysis'
              label={COMPONENT_MAP['res_analysis'].label}
              to={COMPONENT_MAP['res_analysis'].url}
              icon={FileSearch}
              description='量化排程績效，包含交期達成率預估與機台閒置分析報告。'
              tag='Insights'
              tagColor='gold'
            />
          </Col>
          <Col xs={24} md={12}>
            <FeatureCard
              id='res_history'
              label={COMPONENT_MAP['res_history'].label}
              to={COMPONENT_MAP['res_history'].url}
              icon={CopyCheck}
              description='保存多個排程情境，對比不同策略對產線造成的衝擊與成本變化。'
              tag='Versioning'
              tagColor='blue'
            />
          </Col>
        </Row>
      </section>
    </div>
  )
}

export default SchedulingRes
