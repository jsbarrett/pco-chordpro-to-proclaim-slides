// ----------------------------------------------------------------------------
// VARIABLES
// ----------------------------------------------------------------------------

const baseUrl = 'https://api.planningcenteronline.com/services/v2'
const headers = {
  Authorization: `Basic ${btoa('f29157f7e634aa2a4bfe045b8ab42695593006cde73e3c23f67c97b6bfad6734:b453d9d268545723a8c5a0b250e9640bca8be2403a1582d7a6f26ae2896bb55b')}`
}

// ----------------------------------------------------------------------------
// UTILS
// ----------------------------------------------------------------------------

const consoleLog = x => { console.log(x); return x }
const map = fn => arr => arr.map(fn)
const pipe = fns => x => fns.reduce((result, fn) => fn(result), x)
const PromiseAll = arr => Promise.all(arr)

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

const download = (name, data) => {
  const anchorElement = document.createElement('a')
  anchorElement.setAttribute('href', 'data:text/plan;charset=utf8,' + encodeURIComponent(data))
  anchorElement.setAttribute('download', name)
  document.body.appendChild(anchorElement)
  anchorElement.click()
  document.body.removeChild(anchorElement)
}

// ----------------------------------------------------------------------------
// PCO API HELPER FUNCTIONS
// ----------------------------------------------------------------------------

const getUpcomingPlan = async () => {
  return fetch(`https://api.planningcenteronline.com/services/v2/service_types/1154599/plans?filter=future`, { headers })
    .then(x => x.json())
    .then(x => x.data[0].id)
}

const pluckSongIdAndArrangementId = item => {
  return {
    songId: item.relationships.song.data.id,
    arrangementId: item.relationships.arrangement.data.id,
    item,
  }
}

const getPlanItems = async planId => {
  return fetch(`https://api.planningcenteronline.com/services/v2/service_types/1154599/plans/${planId}/items`, { headers })
    .then(x => x.json())
    .then(items => items.data.filter(x => x.attributes.item_type === 'song'))
    .then(pipe([
      map(pluckSongIdAndArrangementId),
      map(getSongDetailsAndArrangement),
      PromiseAll,
     ]))
    .then(consoleLog)
}

const getSongDetailsAndArrangement = async ({ songId, arrangementId, item }) => {
  const arrangement = await fetch(`${baseUrl}/songs/${songId}/arrangements/${arrangementId}`, { headers })
    .then(x => x.json())
    .then(x => x.data)

  const song = await fetch(`${baseUrl}/songs/${songId}`, { headers })
    .then(x => x.json())
    .then(x => x.data)

  return {
    item,
    arrangement,
    song,
  }
}

// ----------------------------------------------------------------------------
// MAIN
// ----------------------------------------------------------------------------

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

downloadbtn.addEventListener('click', async () => {
  try {
    const upcomingPlanId = await getUpcomingPlan()
    const retrievedItems = await getPlanItems(upcomingPlanId)

    retrievedItems.forEach(item => {
      const title = item.item.attributes.title
      const filename = `${title}.txt`
      const lyrics = parseChordChart(item.arrangement.attributes.chord_chart)
      const { author, copyright, } = item.song.attributes
      const copyrightInfo = `\n\nTitle: ${title}\nAuthor: ${author}\nCopyright: ${copyright}`
      const data = `${title}\n\n${lyrics}\n\n${copyrightInfo}`
      // console.log({ filename, data })
      download(filename, data)
    })
  } catch (err) {
    console.error(err)
  }
})

