// Same "hotness" formula as the original prototype: newer + more-upvoted posts rank higher,
// with a gravity exponent that decays a post's rank as it ages.
function hotScore(post) {
  const ageHours = (Date.now() - new Date(post.created_at).getTime()) / 3_600_000;
  return post.votes / Math.pow(ageHours + 2, 1.4);
}

function sortByHot(posts) {
  return [...posts].sort((a, b) => hotScore(b) - hotScore(a));
}

module.exports = { hotScore, sortByHot };
