import Drop from '~/utils/drop'

const drop = new Drop({
    lineColor: 0xff0000,
    pointColor: 0xff0000,
    particleColor: 0xff0000,
    pointSize: 0.05,
    lineMaxDistance: 3.7,//2.5,
    particleSize: 0.14,
    particleTexture: '/assets/particle.png',
    particleRotationSpeed: 0.016,
    particleRadiusExpansion: 0.9,
    particleSpeedVariance: 0.3,
    particleSpeedFactor: 10,
    pointDefinitions: [
        { count: 1, y: 10, radius: 0 },
        { count: 2, y: 9, radius: 0.8 },
        { count: 3, y: 8, radius: 1.2 },
        { count: 4, y: 7, radius: 2 },
        { count: 8, y: 6, radius: 2.4 },
        { count: 8, y: 5, radius: 3.1 },
        { count: 7, y: 4, radius: 3.2 },
        { count: 6, y: 3, radius: 3.4 },
        { count: 8, y: 2, radius: 3.0 },
        { count: 5, y: 1, radius: 2.2 },
        { count: 3, y: 0.4, radius: 1.2 },
        { count: 1, y: -0.1, radius: 0 },
    ]

})

export default ({ app }, inject) => {
    inject('drop', drop)
}