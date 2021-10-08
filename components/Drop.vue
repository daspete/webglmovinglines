<template>
    <!-- <div class="drop bg-indigo-500" ref="dropcontainer">
        <canvas class="w-full h-full" ref="drop"></canvas>
    </div> -->
    <div class="drop" ref="dropcontainer">
        <div class="drop__shadow"></div>
        <div class="drop__image"></div>
        <canvas class="drop__canvas" ref="dropcanvas"></canvas>
        <div class="drop__imageoverlay"></div>
    </div>
</template>


<script>
export default {
    mounted(){
        this.$drop.StartEngine(this.$refs.dropcontainer, this.$refs.dropcanvas);
        this.$drop.CreatePoints()
        this.$drop.CreateNet()
        this.$drop.CreateParticles()
        this.$drop.Update()
    }
}
</script>



<style lang="scss">
.drop {
    width: 732px;
    height: 823px;
    @apply relative;
    @apply bg-indigo-600;
    
    &__image {
        background-image: url(/assets/drop.png);
        @apply absolute top-0 left-0 w-full h-full;
        @apply bg-center bg-no-repeat;
    }

    &__shadow {
        background-image: url(/assets/shadow.png);
        @apply absolute top-0 left-0 w-full h-full;
        @apply bg-center bg-no-repeat;
    }

    &__canvas {
        @apply absolute top-0 left-0 w-full h-full;
        mix-blend-mode: screen;
        // opacity: 0.5;
    }

    &__imageoverlay {
        background-image: url(/assets/drop.png);
        @apply absolute top-0 left-0 w-full h-full;
        @apply bg-center bg-no-repeat;
        mix-blend-mode: overlay ;
    }
}
</style>