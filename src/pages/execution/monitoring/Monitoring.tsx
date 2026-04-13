import { Row, Col, Typography } from 'antd'
import { Cpu, Gauge, Activity, PackageSearch } from 'lucide-react'

import FeatureCard from '@/components/featureCard/FeatureCard.tsx'
import { COMPONENT_MAP } from '@/router/constants.tsx'

const { Title, Text } = Typography

const Monitoring: React.FC = () => {
  return (
    <div className='p-8 lg:px-12'>
      <section>
        <div className='flex items-center gap-4 mb-8'>
          <div className='w-1.5 h-6 bg-emerald-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.3)]' />
          <div>
            <Title
              level={4}
              className='m-0 font-black text-slate-800 tracking-tight'
            >
              {COMPONENT_MAP['monitoring'].label}
            </Title>
            <Text className='text-slate-300 text-[9px] font-black uppercase tracking-[0.4em]'>
              Live Monitoring
            </Text>
          </div>
        </div>
        <Row gutter={[20, 20]}>
          <Col xs={24} md={12} xxl={6}>
            <FeatureCard
              id='m_status'
              label={COMPONENT_MAP['m_status'].label}
              to={COMPONENT_MAP['m_status'].url}
              icon={Cpu}
              description='透過 PLC 連結即時獲取機台運轉、待機、維修或異常狀態。'
              tag='IoT'
              tagColor='blue'
            />
          </Col>
          <Col xs={24} md={12} xxl={6}>
            <FeatureCard
              id='w_prog'
              label={COMPONENT_MAP['w_prog'].label}
              to={COMPONENT_MAP['w_prog'].url}
              icon={Gauge}
              description='視覺化呈現工單預計完工日與實際進度的偏差值，預警延遲。'
              tag='Progress'
              tagColor='emerald'
            />
          </Col>
          <Col xs={24} md={12} xxl={6}>
            <FeatureCard
              id='wip_flow'
              label={COMPONENT_MAP['wip_flow'].label}
              to={COMPONENT_MAP['wip_flow'].url}
              icon={Activity}
              description='全場 WIP 水位監控，識別各工段間的堆積與流動速率瓶頸。'
              tag='Visibility'
              tagColor='emerald'
            />
          </Col>
          <Col xs={24} md={12} xxl={6}>
            <FeatureCard
              id='material_readiness'
              label={COMPONENT_MAP['material_readiness'].label}
              to={COMPONENT_MAP['material_readiness'].url}
              icon={PackageSearch}
              description='結合倉儲數據，即時判斷下一站點之物料供應是否到位。'
              tag='Supply'
              tagColor='orange'
            />
          </Col>
        </Row>
      </section>
    </div>
  )
}

export default Monitoring
