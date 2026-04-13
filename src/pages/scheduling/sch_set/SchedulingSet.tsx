import { Row, Col, Typography } from 'antd'
import { Settings2, ShieldCheck } from 'lucide-react'

import FeatureCard from '@/components/featureCard/FeatureCard.tsx'
import { COMPONENT_MAP } from '@/router/constants.tsx'

const { Title, Text } = Typography

const SchedulingSet: React.FC = () => {
  return (
    <div className='p-8 lg:px-12'>
      <section>
        <div className='flex items-center gap-4 mb-8'>
          <div className='w-1.5 h-8 bg-indigo-500 rounded-full' />
          <div>
            <Title
              level={3}
              className='m-0 font-black text-slate-800 tracking-tight'
            >
              {COMPONENT_MAP['sch_set'].label}
            </Title>
            <Text className='text-slate-400 text-xs font-bold uppercase tracking-widest'>
              Logic & Constraints
            </Text>
          </div>
        </div>
        <Row gutter={[24, 24]}>
          <Col xs={24} md={12}>
            <FeatureCard
              id='sch_rules'
              label={COMPONENT_MAP['sch_rules'].label}
              to={COMPONENT_MAP['sch_rules'].url}
              icon={ShieldCheck}
              description='設定交期優先、稼動率優先或換模成本最低等權重規則。'
              tag='Priority Rules'
              tagColor='cyan'
            />
          </Col>
          <Col xs={24} md={12}>
            <FeatureCard
              id='sch_params'
              label={COMPONENT_MAP['sch_params'].label}
              to={COMPONENT_MAP['sch_params'].url}
              icon={Settings2}
              description='微調緩衝工時、機台切換效率與人力技能等級等核心參數。'
              tag='Configuration'
              tagColor='orange'
            />
          </Col>
        </Row>
      </section>
    </div>
  )
}

export default SchedulingSet
