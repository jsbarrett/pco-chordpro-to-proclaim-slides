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
    .replace(/\[.*?\]/g, '')
    .replace(/\t/g, '')
    .split('\n\n')
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

input.value = chordchart
output.value = parseChordChart(chordchart)

downloadbtn.addEventListener('click', () => {
  download('How Deep The Father\'s Love For Us.txt', parseChordChart(chordchart))
})
