import React from 'react'
import Layout, { PageHeader } from '@/components/Layout'
import LeaveRequestForm from '@/components/LeaveRequestForm'

export default function ApplyLeavePage() {
  return (
    <Layout>
      <PageHeader
        title="Apply for Leave"
        subtitle="Submit a new leave request for approval"
      />
      <LeaveRequestForm />
    </Layout>
  )
}
