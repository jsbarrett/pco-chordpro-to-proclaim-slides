const consoleLog = x => { console.log(x); return x }

const groupInTwos = lyrics => {
  const grouped = [[]]

  for (let i = 0; i < lyrics.length; i += 1) {
    const lastGrouping = grouped[grouped.length - 1]
    if (lastGrouping.length < 2) {
      lastGrouping.push(lyrics[i])
    } else {
      grouped.push([lyrics[i]])
    }
  }

  return grouped
}

const parseChordChart = chordchart => {
  return chordchart
    .replace(/\[.*?\]/g, '') // remove chords
    .replace(/\t/g, '') // remove tabs
    .split(/\r\n\r\n/) // split by section
    .map(x => {
      const [section, ...lyrics] = x
        .replace(/::::/g, '\n')
        .replace(/::/g, '\n')
        .split('\n')
        .map(x => x.trim())
      return {
        section,
        lyrics
      }
    })
    .filter(x => x.section !== 'INTRO')
    .map(x => {
      const pairs = groupInTwos(x.lyrics)
        .map(x => x.join('\n'))
        .join('\n\n')

      return `${x.section}\n${pairs}`
    })
    .join('\n\n')
    .replace(/ +/g, ' ')
    .replace(/ - /g, '')
}

const download = (name, data) => {
  const anchorElement = document.createElement('a')
  anchorElement.setAttribute('href', 'data:text/plan;charset=utf8,' + encodeURIComponent(data))
  anchorElement.setAttribute('download', name)
  document.body.appendChild(anchorElement)
  anchorElement.click()
  document.body.removeChild(anchorElement)
}

const baseUrl = 'https://api.planningcenteronline.com/services/v2'
const headers = {
  Authorization: `Basic ${btoa('f29157f7e634aa2a4bfe045b8ab42695593006cde73e3c23f67c97b6bfad6734:b453d9d268545723a8c5a0b250e9640bca8be2403a1582d7a6f26ae2896bb55b')}`
}

const getArrangementForItem = async item => {
  const songId = item.relationships.song.data.id
  const arrangementId = item.relationships.arrangement.data.id
  return fetch(`${baseUrl}/songs/${songId}/arrangements/${arrangementId}`, { headers })
    .then(x => x.json())
    .then(x => x.data)
    .then(x => {
      return {
        item,
        arrangement: x
      }
    })
}

const getPlanItems = async planId => {
  return fetch(`https://api.planningcenteronline.com/services/v2/service_types/1154599/plans/${planId}/items`, { headers })
    .then(x => x.json())
    .then(items => items.data.filter(x => x.attributes.item_type === 'song'))
    .then(items => Promise.all(items.map(getArrangementForItem)))
    .then(consoleLog)
}

downloadbtn.addEventListener('click', async () => {
  try {
    const upcomingPlanId = await getUpcomingPlan()
    const retrievedItems = await getPlanItems(upcomingPlanId)
    retrievedItems.forEach(item => {
      download(`${item.item.attributes.title}.txt`, parseChordChart(item.arrangement.attributes.chord_chart))
    })
  } catch (err) {
    console.error(err)
  }
})

const getUpcomingPlan = async () => {
  return fetch(`https://api.planningcenteronline.com/services/v2/service_types/1154599/plans?filter=future`, { headers })
    .then(x => x.json())
    .then(x => x.data[0].id)
}
