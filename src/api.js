// Fake API
const api = {
  fetchTalks: (hubId) => Promise.resolve([
    { id: 1, title: 'Boundaries', collection: { id: 1001 }, user: { id: 10 }},
    { id: 2, title: 'Value of Values', collection: { id: 1000 }, user: { id: 11 } },
    { id: 3, title: 'Simple Made Easy', collection: { id: 1000 }, user: { id: 11 } }
  ])
}

export default api
