import { useEffect, useState } from 'react'

function useApiResource(loader, initialValue) {
  const [data, setData] = useState(initialValue)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  async function reload() {
    try {
      setLoading(true)
      setError('')
      setData(await loader())
    } catch (currentError) {
      setError(currentError.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true

    loader()
      .then((result) => {
        if (active) {
          setData(result)
          setError('')
        }
      })
      .catch((currentError) => {
        if (active) {
          setError(currentError.message)
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
    // The initial loader is intentionally captured on mount; manual refresh uses reload().
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { data, error, loading, reload, setData }
}

export default useApiResource
