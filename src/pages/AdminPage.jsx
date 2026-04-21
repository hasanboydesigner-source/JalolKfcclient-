import React from 'react'
import AdminPanel from '../components/AdminPanel'

const AdminPage = ({
  products,
  searchQuery,
  handleOpenModal,
  handleDeleteProduct,
  INITIAL_CATEGORIES,
}) => {
  return (
    <AdminPanel
      products={products}
      searchQuery={searchQuery}
      handleOpenModal={handleOpenModal}
      handleDeleteProduct={handleDeleteProduct}
      INITIAL_CATEGORIES={INITIAL_CATEGORIES}
    />
  )
}

export default AdminPage
